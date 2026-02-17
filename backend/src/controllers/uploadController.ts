import { Request, Response } from 'express';
import { analyzeDocument, generateQuestionsAI, evaluateAnswersAI } from '../services/aiService';
import {
    logTrainingAssigned,
    logDocumentViewed,
    logAssessmentStarted,
    logAssessmentSubmitted,
    logAssessmentResult,
    logStatusChanged,
    logLateCompletion
} from '../services/auditService';
import TrainingSession from '../models/TrainingSession';
import Training from '../models/Training';
import TrainingRecord from '../models/TrainingRecord';
import DocumentLink from '../models/DocumentLink';
import LearningProgress from '../models/LearningProgress';
import User from '../models/User';
import { AuthRequest } from '../types/express';
import Notification from '../models/Notification';

import { sendDocumentAssignmentEmail } from '../services/emailService';
import { sendNotification } from '../services/notificationService';
import fs from 'fs';
import { triggerRetraining } from '../services/retrainingService';
import { generateCertificateId, generateCertificatePDF } from '../services/certificateService';
import TrainingMaster from '../models/TrainingMaster';
import TrainingCertificate from '../models/TrainingCertificate';

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        // Rename file to include extension
        // Standardize path usage (forward slashes)
        let filePath = req.file.path.replace(/\\/g, '/');
        const fileExtension = req.file.originalname.split('.').pop();
        const newFilePath = `${filePath}.${fileExtension}`;

        fs.renameSync(filePath, newFilePath);
        filePath = newFilePath;

        const fileType = req.file.mimetype;

        // 1. Analyze Document
        const text = await analyzeDocument(filePath, fileType);
        console.log('Document text length:', text.length);

        if (text.length === 0) {
            throw new Error('No text could be extracted from the document. Please ensure the PDF contains selectable text (not just images).');
        }

        // 2. Generate Questions
        const questions = await generateQuestionsAI(text);
        console.log('Generated questions:', questions);

        // 2b. Map Questions to Schema
        const mappedQuestions = {
            mcq: questions.mcq.map(q => ({ question: q.question, options: q.options, correctAnswer: q.answer }))
        };

        // 3. Determine Target Users
        let targetUserIds: string[] = [];
        const assignedUsersRaw = req.body.assignedUsers;
        const dueDateRaw = req.body.dueDate; // Get due date from request
        const isSystemAssignment = !!assignedUsersRaw;


        if (isSystemAssignment) {
            console.log('Processing Admin Assignment:', assignedUsersRaw);

            if (req.body.departments) {
                // Handle Department Assignment - PRIORITIZE THIS
                const departments = Array.isArray(req.body.departments)
                    ? req.body.departments
                    : JSON.parse(req.body.departments);

                console.log('Processing Department Assignment:', departments);
                const users = await User.find({ department: { $in: departments } });
                targetUserIds = users.map(u => u._id.toString());
            } else if (assignedUsersRaw === 'ALL') {
                const users = await User.find({}); // Assign to everyone
                targetUserIds = users.map(u => u._id.toString());
            } else {
                try {
                    // Handle if it's already an array or needs parsing
                    targetUserIds = Array.isArray(assignedUsersRaw)
                        ? assignedUsersRaw
                        : JSON.parse(assignedUsersRaw);
                } catch (e) {
                    // Fallback for single ID string
                    targetUserIds = [assignedUsersRaw as string];
                }
            }
        } else if (authReq.user) {
            // Ad-hoc / Self-Practice
            targetUserIds = [authReq.user._id.toString()];
        }

        if (!authReq.user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }

        // 4. Create Document Link (Mocking DMS ID)
        const docId = `DOC-${Date.now()}`;
        const version = "1.0";

        // 4b. Create Training (Master Record with Content)
        const training = await Training.create({
            code: isSystemAssignment ? docId : `ADHOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: req.file!.originalname,
            description: isSystemAssignment ? 'Mandatory Compliance Training' : 'Uploaded document training',
            purpose: isSystemAssignment ? 'Compliance' : 'Self-initiated learning',
            type: 'Document-driven',
            mandatory: isSystemAssignment,
            version: version,
            createdBy: authReq.user._id,
            content: {
                fileName: req.file.originalname,
                fileUrl: filePath,
                text: text,
                questions: mappedQuestions
            }
        });

        // 4c. Create DocumentLink Entry
        const docLink = await DocumentLink.create({
            training: training._id,
            documentId: docId,
            documentVersionId: `${docId}-v${version}`,
            versionString: version,
            effectiveDate: new Date(),
            isPrimary: true,
            linkedBy: authReq.user!._id
        });


        if (isSystemAssignment && targetUserIds.length === 0) {
            res.status(400).json({ message: 'No users found in the selected departments. Please ensure trainees are registered in those departments.' });
            return;
        }

        // 5. Create TrainingRecords
        const createdRecords = [];
        let adhocSession = null;

        const effectiveDueDate = dueDateRaw ? new Date(dueDateRaw) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Use provided date or default

        for (const uid of targetUserIds) {
            const record = await TrainingRecord.create({
                user: uid,
                training: training._id,
                documentLink: docLink._id,
                status: (isSystemAssignment) ? 'PENDING' : 'IN_PROGRESS', // Ad-hoc starts immediately
                dueDate: effectiveDueDate,
                documentViewed: !isSystemAssignment, // If self-upload, considered viewed. If assigned, NOT viewed.
                assessmentAttempts: 0,
                assignmentSource: isSystemAssignment ? 'manual' : 'system',
                startedDate: isSystemAssignment ? undefined : new Date()
            });
            createdRecords.push(record);

            if (isSystemAssignment) {
                await logTrainingAssigned(
                    uid,
                    training._id.toString(),
                    record._id.toString(),
                    {},
                    req
                );
            } else {
                // If ad-hoc, it starts immediately
                await logDocumentViewed(
                    uid,
                    training._id.toString(),
                    record._id.toString(),
                    req
                );
            }

            // Notify user about the new assignment
            if (isSystemAssignment) {
                try {
                    await sendNotification(uid, 'TRAINING_ASSIGNED', {
                        trainingTitle: req.file!.originalname,
                        dueDate: effectiveDueDate
                    });
                } catch (notiError) {
                    console.error(`Failed to run notification tasks for user ${uid}:`, notiError);
                }
            }
            // If Ad-hoc, create the session immediately to maintain backward compatibility
            if (!isSystemAssignment && uid === authReq.user!._id.toString()) {
                adhocSession = new TrainingSession({
                    fileName: req.file.originalname,
                    documentText: text,
                    questions: questions,
                    user: uid,
                    trainingRecord: record._id,
                    fileUrl: filePath
                });
                await adhocSession.save();

                // Create initial LearningProgress for ad-hoc
                await LearningProgress.create({
                    trainingRecord: record._id,
                    user: uid,
                    contentItems: [{
                        contentId: `doc-${Date.now()}`,
                        contentType: 'document',
                        title: req.file.originalname,
                        totalPages: 1,
                        isCompleted: true,
                        completedAt: new Date(),
                        lastAccessedAt: new Date(),
                        timeSpent: 0
                    }],
                    overallProgress: {
                        totalContentItems: 1,
                        completedContentItems: 1,
                        totalTimeSpent: 0,
                        lastActivityAt: new Date()
                    },
                    assessmentReady: true,
                    assessmentReadyAt: new Date()
                });
            }
        }

        // 6. Send Response
        if (adhocSession) {
            const responseQuestions = {
                mcq: questions.mcq.map(q => ({ question: q.question, options: q.options }))
            };

            res.status(201).json({
                sessionId: adhocSession._id.toString(),
                questions: responseQuestions
            });
        } else {
            res.status(201).json({
                message: `Document processed and assigned to ${createdRecords.length} users`,
                trainingId: training._id,
                documentId: docId,
                version: version
            });

            // Trigger Retraining Logic (Async - Fire and Forget)
            // We pass the authReq to preserve audit context
            triggerRetraining(training._id.toString(), authReq).catch(err =>
                console.error('Retraining trigger failed:', err)
            );
        }

    } catch (error) {
        console.error("Upload error:", error);
        const logMessage = `${new Date().toISOString()} - Upload Error: ${(error as Error).message}\nStack: ${(error as Error).stack}\n\n`;
        fs.appendFileSync('server_error.log', logMessage);
        res.status(500).json({ message: 'Error processing document', error: (error as Error).message });
    }
};

export const submitAnswers = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log("DEBUG: submitAnswers called");
        console.log("DEBUG: req.body:", JSON.stringify(req.body, null, 2));
        const { sessionId, answers } = req.body;

        const session = await TrainingSession.findById(sessionId);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        if (session.status === 'completed') {
            res.status(400).json({ message: 'Training already completed' });
            return;
        }

        // Evaluate with AI
        const evaluation = await evaluateAnswersAI(session.documentText, session.questions, answers);

        // Fetch record context for auditing
        let record = null;
        if (session.trainingRecord) {
            record = await TrainingRecord.findById(session.trainingRecord);
        }

        // LOG AUDIT: Assessment Started (Sprint 2)
        if (session.trainingRecord) {
            await logAssessmentStarted(
                session.user.toString(),
                record?.training?.toString() || (session as any).trainingId || '',
                session.trainingRecord.toString(),
                { attemptNumber: (record?.assessmentAttempts || 0) + 1 },
                req
            );
        }

        // DEBUG: Log the evaluation result to check for correctAnswer
        const debugLog = `\n--- Evaluation Debug ${new Date().toISOString()} ---\n${JSON.stringify(evaluation, null, 2)}\n--------------------------------\n`;
        fs.appendFileSync('ai_debug.log', debugLog);

        // Update Session
        session.userAnswers = answers;
        session.score = evaluation.score;
        session.percentage = evaluation.percentage;
        session.evaluationResults = evaluation.results;
        session.status = 'completed';

        await session.save();

        // LOG AUDIT: Assessment Submitted (Sprint 2)
        if (session.trainingRecord) {
            await logAssessmentSubmitted(
                session.user.toString(),
                (session as any).trainingId || record?.training?.toString() || '',
                session.trainingRecord.toString(),
                session._id.toString(),
                {
                    score: evaluation.percentage
                },
                req
            );
        }

        // Update Linked TrainingRecord if exists
        if (session.trainingRecord) {
            if (record) {
                // Sprint 2: Extended Status Logic
                const MAX_ATTEMPTS = 3;
                const passed = (evaluation.percentage || 0) >= 35;
                const now = new Date();

                record.score = evaluation.percentage;
                record.passed = passed;
                record.assessmentAttempts = (record.assessmentAttempts || 0) + 1;
                record.lastAttemptDate = now;

                if (passed) {
                    const oldStatus = record.status;
                    record.status = 'COMPLETED';
                    record.completedDate = now;

                    if (record.dueDate && record.dueDate < now) {
                        record.completedLate = true;
                        await logLateCompletion(
                            record.user.toString(),
                            record.training.toString(),
                            record._id.toString(),
                            req
                        );
                    }

                    await logStatusChanged(
                        record.user.toString(),
                        record.training.toString(),
                        record._id.toString(),
                        oldStatus,
                        'COMPLETED',
                        req
                    );
                } else {
                    const oldStatus = record.status;
                    if (record.assessmentAttempts >= MAX_ATTEMPTS) {
                        record.status = 'LOCKED';
                        await logStatusChanged(
                            record.user.toString(),
                            record.training.toString(),
                            record._id.toString(),
                            oldStatus,
                            'LOCKED',
                            req
                        );
                    } else {
                        record.status = 'FAILED';
                    }
                }

                // Sprint 3: Certificate & Expiry Logic (Harmonized with assessmentController)
                if (passed && (!record.certificateId || !record.certificateUrl)) {
                    try {
                        // 1. Calculate Expiry
                        const trainingDoc = await Training.findById(record.training).populate('trainingMaster') as any;
                        if (trainingDoc && trainingDoc.trainingMaster) {
                            const master = trainingDoc.trainingMaster;
                            if (master.validity_period && master.validity_period > 0) {
                                const validityDays = master.validity_unit === 'years' ? master.validity_period * 365 :
                                    master.validity_unit === 'months' ? master.validity_period * 30 :
                                        master.validity_period;

                                const expiryDate = new Date();
                                expiryDate.setDate(expiryDate.getDate() + validityDays);
                                record.expiryDate = expiryDate;
                            }
                        }

                        // 2. Generate Certificate
                        const fullRecord = await TrainingRecord.findById(record._id)
                            .populate('user')
                            .populate({ path: 'training', populate: { path: 'trainingMaster' } });

                        if (fullRecord && fullRecord.user && fullRecord.training) {
                            const userObj = fullRecord.user;
                            const trainingObj = fullRecord.training;
                            const masterObj = (trainingObj as any).trainingMaster;

                            const certId = generateCertificateId(userObj, trainingObj);
                            record.certificateId = certId;
                            record.resultGrade = evaluation.percentage > 60 ? 'EXCELLENT' : 'PASS';

                            const pdfPath = await generateCertificatePDF(record, userObj, trainingObj, masterObj);
                            record.certificateUrl = pdfPath;

                            console.log(`[Certificate] Generated ${certId} for AI assessment at ${pdfPath}`);

                            // Create Dedicated Certificate Record
                            await TrainingCertificate.create({
                                certificateId: certId,
                                user: userObj._id,
                                training: trainingObj._id,
                                trainingRecord: record._id,
                                score: evaluation.percentage,
                                resultGrade: record.resultGrade,
                                certificateUrl: pdfPath,
                                expiryDate: record.expiryDate
                            });
                            console.log(`[Certificate] Stored in trainingcertificates collection: ${certId}`);
                        }
                    } catch (certError) {
                        console.error('[Certificate] Error in AI flow:', certError);
                    }
                }

                await record.save();

                // LOG AUDIT: Assessment Result (Sprint 2: PASS/FAIL)
                await logAssessmentResult(
                    record.user.toString(),
                    record.training.toString(),
                    record._id.toString(),
                    session._id.toString(),
                    passed,
                    record.score || 0,
                    req
                );
            }
        }

        res.json({
            score: session.score,
            percentage: session.percentage,
            results: evaluation.results,
            passed: (evaluation.percentage || 0) >= 35,
            certificateUrl: record?.certificateUrl || null,
            resultGrade: record?.resultGrade || (evaluation.percentage > 60 ? 'EXCELLENT' : 'PASS')
        });

    } catch (error) {
        console.error("Submit error:", error);
        res.status(500).json({ message: 'Error evaluating answers', error: (error as Error).message });
    }
};

export const getTrainingResult = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const session = await TrainingSession.findById(id);

        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        res.json({
            score: session.score,
            percentage: session.percentage,
            results: session.evaluationResults,
            status: session.status
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching result', error: (error as Error).message });
    }
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log('getSession called with id:', id);
        const session = await TrainingSession.findById(id);
        console.log('Session found:', !!session);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        // Return questions without answers for security
        const responseQuestions = {
            mcq: session.questions.mcq?.map(q => ({ question: q.question, options: q.options })) || [],
            shortAnswer: session.questions.shortAnswer?.map(q => q.question) || [],
            trueFalse: session.questions.trueFalse?.map(q => q.question) || []
        };

        if (session.trainingRecord) {
            await logDocumentViewed(
                session.user.toString(),
                (session as any).trainingId || '',
                session.trainingRecord.toString(),
                req
            );
        }

        res.json({
            sessionId: session._id,
            fileName: session.fileName,
            questions: responseQuestions,
            status: session.status,
            fileUrl: session.fileUrl // Send fileUrl to frontend
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session', error: (error as Error).message });
    }
};
