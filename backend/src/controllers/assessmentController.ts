import { Response } from 'express';
import { AuthRequest } from '../types/express';
import Assessment from '../models/Assessment';
import AssessmentQuestion from '../models/AssessmentQuestion';
import AssessmentAttempt from '../models/AssessmentAttempt';
import { logAssessmentConfigCreated, logAssessmentConfigUpdated, logRejectedTransition } from '../services/auditService';
import TrainingCertificate from '../models/TrainingCertificate';

// @desc    Create assessment for training
// @route   POST /api/assessments
// @access  Private (Admin)
export const createAssessment = async (req: AuthRequest, res: Response) => {
    const { trainingId, pass_percentage, max_attempts, questions } = req.body;

    try {
        // 1. Check if assessment already exists (URS-TMS-S2-006)
        const existing = await Assessment.findOne({ training: trainingId });
        if (existing) {
            res.status(400).json({ message: 'An assessment already exists for this training' });
            return;
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            res.status(400).json({ message: 'At least one MCQ question is required' });
            return;
        }

        for (const q of questions) {
            if (!q.question_text) {
                res.status(400).json({ message: 'Question text is required for all questions' });
                return;
            }
            if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
                res.status(400).json({ message: `Each question must have exactly 4 options. Question: "${q.question_text}"` });
                return;
            }
            if (!q.correct_answer || !q.options.includes(q.correct_answer)) {
                res.status(400).json({ message: `Correct answer must match one of the provided options. Question: "${q.question_text}"` });
                return;
            }
        }

        // 2. Create Assessment
        const assessment = await Assessment.create({
            training: trainingId,
            pass_percentage,
            max_attempts
        });

        // 3. Create Questions
        const questionDocs = questions.map(q => ({
            assessment: assessment._id,
            question_text: q.question_text,
            options: q.options,
            correct_answer: q.correct_answer
        }));
        await AssessmentQuestion.insertMany(questionDocs);

        await logAssessmentConfigCreated(req.user!._id.toString(), trainingId, { pass_percentage, max_attempts, questionCount: questions.length }, req);

        res.status(201).json(assessment);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get assessment configuration (Admin-friendly)
// @route   GET /api/assessments/training/:trainingId
// @access  Private (Admin/User)
export const getAssessmentByTraining = async (req: AuthRequest, res: Response) => {
    const { trainingId } = req.params;
    const userId = req.user!._id.toString();
    const isAdmin = req.user && req.user.role === 'Administrator';

    try {
        // 1. Compliance Check for Non-Admins (URS-TMS-S2-011, 012, 018, 019)
        if (!isAdmin) {
            const TrainingRecord = (await import('../models/TrainingRecord')).default;
            const record = await TrainingRecord.findOne({ user: userId, training: trainingId });

            if (!record) {
                // If no record, we use trainingId as the target
                await logRejectedTransition(userId, trainingId, 'ACCESS_ASSESSMENT', 'NOT_ASSIGNED', {}, req);
                res.status(403).json({ message: 'Access denied: Training is not assigned to you.' });
                return;
            }

            if (!record.documentAcknowledged) {
                await logRejectedTransition(userId, record._id.toString(), 'ACCESS_ASSESSMENT', 'DOC_NOT_ACKNOWLEDGED', {}, req);
                res.status(403).json({ message: 'Access denied: You must acknowledge the training document before attempting the assessment.' });
                return;
            }

            if (['FAILED', 'LOCKED'].includes(record.status)) {
                await logRejectedTransition(userId, record._id.toString(), 'ACCESS_ASSESSMENT', `STATUS_${record.status}`, {}, req);
                const statusMsg = record.status === 'LOCKED'
                    ? 'Training is LOCKED due to maximum attempts. Please contact Admin.'
                    : 'Training status is FAILED. Access to assessment is strictly restricted.';
                res.status(403).json({ message: `Access denied: ${statusMsg}` });
                return;
            }
        }

        const assessment = await Assessment.findOne({ training: trainingId }).lean();
        if (!assessment) {
            res.status(404).json({ message: 'No assessment configured for this training' });
            return;
        }

        // Get questions
        // Compliance: "Correct answers must never be exposed to UI responses" (Employee)
        // Admin: NEEDS to see correct answers for configuration management.
        const questionsQuery = AssessmentQuestion.find({ assessment: assessment._id });

        if (isAdmin) {
            questionsQuery.select('+correct_answer');
        }

        const questions = await questionsQuery;

        // Log Assessment Start (Employee only)
        if (!isAdmin) {
            const auditService = await import('../services/auditService');
            // 'record' is defined in the compliance check block above
            const TrainingRecord = (await import('../models/TrainingRecord')).default;
            const record = await TrainingRecord.findOne({ user: userId, training: trainingId });
            if (record) {
                await auditService.logAssessmentStarted(userId, trainingId, record._id.toString(), { attemptNumber: record.assessmentAttempts + 1 }, req);
            }
        }

        // Check if locked for editing (Admin rule)
        const AssessmentAttempt = (await import('../models/AssessmentAttempt')).default;
        const attemptCount = await AssessmentAttempt.countDocuments({ training: trainingId });

        res.json({
            ...assessment,
            questions,
            isLocked: attemptCount > 0
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Update assessment configuration
// @route   PUT /api/assessments/:id
// @access  Private (Admin)
export const updateAssessment = async (req: AuthRequest, res: Response) => {
    const { pass_percentage, max_attempts, questions } = req.body;

    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            res.status(404).json({ message: 'Assessment not found' });
            return;
        }

        // Check for existing attempts (URS-TMS-S2-010)
        const attemptCount = await AssessmentAttempt.countDocuments({ training: assessment.training });
        if (attemptCount > 0) {
            await logRejectedTransition(req.user!._id.toString(), assessment._id.toString(), 'UPDATE_ASSESSMENT_CONFIG', 'Configuration is locked due to existing attempts', {}, req);
            res.status(403).json({ message: 'Assessment configuration is locked because user attempts already exist.' });
            return;
        }

        // Update main config
        assessment.pass_percentage = pass_percentage ?? assessment.pass_percentage;
        assessment.max_attempts = max_attempts ?? assessment.max_attempts;
        await assessment.save();

        // Update questions (Replace all for simplicity if not locked)
        if (questions && Array.isArray(questions)) {
            // Validate Questions (URS-TMS-S2-007)
            if (questions.length === 0) {
                res.status(400).json({ message: 'At least one MCQ question is required' });
                return;
            }

            for (const q of questions) {
                if (!q.question_text) {
                    res.status(400).json({ message: 'Question text is required for all questions' });
                    return;
                }
                if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
                    res.status(400).json({ message: `Each question must have exactly 4 options. Question: "${q.question_text}"` });
                    return;
                }
                if (!q.correct_answer || !q.options.includes(q.correct_answer)) {
                    res.status(400).json({ message: `Correct answer must match one of the provided options. Question: "${q.question_text}"` });
                    return;
                }
            }

            await AssessmentQuestion.deleteMany({ assessment: assessment._id });
            const questionDocs = questions.map(q => ({
                assessment: assessment._id,
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer
            }));
            await AssessmentQuestion.insertMany(questionDocs);
        }

        await logAssessmentConfigUpdated(req.user!._id.toString(), assessment.training.toString(), {
            pass_percentage,
            max_attempts,
            questionsUpdated: !!questions,
            questionCount: questions ? questions.length : undefined
        }, req);

        res.json(assessment);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Submit assessment answers
// @route   POST /api/assessments/submit
// @access  Private (User)
export const submitAssessment = async (req: AuthRequest, res: Response) => {
    const { trainingId, answers } = req.body; // answers is a Map/Object of { [questionId]: answerText }
    const userId = req.user!._id.toString();

    try {
        // 1. Pre-check Access (URS-TMS-S2-011, 012, 018, 019)
        const TrainingRecord = (await import('../models/TrainingRecord')).default;
        const record = await TrainingRecord.findOne({ user: userId, training: trainingId });

        if (!record) {
            await logRejectedTransition(userId, trainingId, 'SUBMIT_ASSESSMENT', 'NOT_ASSIGNED', {}, req);
            res.status(403).json({ message: 'Access denied: Training is not assigned to you.' });
            return;
        }

        if (!record.documentAcknowledged) {
            await logRejectedTransition(userId, record._id.toString(), 'SUBMIT_ASSESSMENT', 'DOC_NOT_ACKNOWLEDGED', {}, req);
            res.status(403).json({ message: 'Access denied: Document must be acknowledged before assessment.' });
            return;
        }

        if (['LOCKED', 'FAILED'].includes(record.status)) {
            await logRejectedTransition(userId, record._id.toString(), 'SUBMIT_ASSESSMENT', `STATUS_${record.status}`, {}, req);
            res.status(403).json({ message: 'Access denied: Training is LOCKED or FAILED.' });
            return;
        }

        // 2. Retrieve Config & Questions (URS-TMS-S2-013)
        const assessment = await Assessment.findOne({ training: trainingId });
        if (!assessment) {
            await logRejectedTransition(userId, trainingId, 'SUBMIT_ASSESSMENT', 'NO_ASSESSMENT_CONFIG', {}, req);
            res.status(404).json({ message: 'No assessment is configured for this training. Submissions are blocked until an assessment is established by Admin.' });
            return;
        }

        // 3. Attempt Enforcement (Backend Hardening)
        if (record.assessmentAttempts >= assessment.max_attempts) {
            await logRejectedTransition(userId, record._id.toString(), 'SUBMIT_ASSESSMENT', 'MAX_ATTEMPTS_EXCEEDED', { attempts: record.assessmentAttempts, max: assessment.max_attempts }, req);
            res.status(403).json({ message: 'Maximum assessment attempts reached. This training is now LOCKED. Please contact Admin for audit review.' });
            return;
        }

        const questions = await AssessmentQuestion.find({ assessment: assessment._id }).select('+correct_answer');
        if (questions.length === 0) {
            await logRejectedTransition(userId, record._id.toString(), 'SUBMIT_ASSESSMENT', 'EMPTY_ASSESSMENT', {}, req);
            res.status(500).json({ message: 'This assessment has no questions configured and cannot be evaluated.' });
            return;
        }

        // 3. Scoring Engine (URS-TMS-S2-014)
        let correctCount = 0;
        const processedAnswers = new Map<string, string>();

        for (const q of questions) {
            const userAnswer = answers[q._id.toString()];
            processedAnswers.set(q._id.toString(), userAnswer || '');

            if (userAnswer === q.correct_answer) {
                correctCount++;
            }
        }

        const totalQuestions = questions.length;
        const score = Math.round((correctCount / totalQuestions) * 100);

        // URS-TMS-S3-001/010: 3-Tier Grading Logic
        // 1. Fail: < 35%
        // 2. Pass: 35% - 60%
        // 3. Excellent: > 60%
        const passed = score >= 35;
        let resultGrade: 'PASS' | 'EXCELLENT' | undefined;

        if (passed) {
            resultGrade = score > 60 ? 'EXCELLENT' : 'PASS';
        }

        const result = passed ? 'PASS' : 'FAIL';

        // 4. Persistence: Create Attempt (URS-TMS-S2-008 - Immutable)
        const currentAttemptNumber = (record.assessmentAttempts || 0) + 1;
        const attempt = await AssessmentAttempt.create({
            training: trainingId,
            user: userId,
            attempt_number: currentAttemptNumber,
            answers: processedAnswers,
            score,
            result
        });

        // 5. Update Training Record (URS-TMS-S2-016 to S2-020)
        const oldStatus = record.status;
        record.assessmentAttempts = currentAttemptNumber;
        record.lastAttemptDate = new Date();
        record.score = score;
        record.passed = passed;
        record.resultGrade = resultGrade;

        if (passed) {
            record.status = 'COMPLETED';
            record.completedDate = new Date();

            if (record.dueDate && new Date() > record.dueDate) {
                record.completedLate = true;
            }

            // Sprint 3: Certificate Generation & Expiry Calculation
            // Only generate if certificate doesn't already exist (prevent duplicates)
            if (!record.certificateId || !record.certificateUrl) {
                // URS-TMS-S3-007: Calculate Expiry Date
                try {
                    const Training = (await import('../models/Training')).default;
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
                            console.log(`[Expiry] Calculated expiry for record ${record._id}: ${expiryDate.toISOString()} (${validityDays} days)`);
                        }
                    }
                } catch (expiryErr) {
                    console.error('[Expiry] Error calculating expiry date:', expiryErr);
                    // Non-blocking error, log and continue
                }

                // URS-TMS-S3-001/004: Generate Certificate
                try {
                    const TrainingRecord = (await import('../models/TrainingRecord')).default;
                    const { generateCertificateId, generateCertificatePDF } = await import('../services/certificateService');

                    const fullRecord = await TrainingRecord.findById(record._id)
                        .populate('user')
                        .populate({ path: 'training', populate: { path: 'trainingMaster' } });

                    if (fullRecord && fullRecord.user && fullRecord.training) {
                        const userObj = fullRecord.user;
                        const trainingObj = fullRecord.training;
                        const masterObj = (trainingObj as any).trainingMaster;

                        // 1. Generate Certificate ID
                        const certId = generateCertificateId(userObj, trainingObj);
                        record.certificateId = certId;

                        // 2. Generate PDF
                        const pdfPath = await generateCertificatePDF(fullRecord, userObj, trainingObj, masterObj);
                        record.certificateUrl = pdfPath;

                        console.log(`[Certificate] Generated ${certId} at ${pdfPath}`);

                        // 3. Log Certificate Generation Event
                        const auditService = await import('../services/auditService');
                        await auditService.logCertificateGenerated(
                            userId,
                            trainingId,
                            record._id.toString(),
                            { certificateId: certId, certificateUrl: pdfPath },
                            req
                        );

                        // 4. Create Dedicated Certificate Record
                        const TrainingCertificate = (await import('../models/TrainingCertificate')).default;
                        await TrainingCertificate.create({
                            certificateId: certId,
                            user: userObj._id,
                            training: trainingObj._id,
                            trainingRecord: record._id,
                            score: score,
                            resultGrade: resultGrade,
                            certificateUrl: pdfPath,
                            expiryDate: record.expiryDate
                        });
                        console.log(`[Certificate] Stored in trainingcertificates collection: ${certId}`);
                    }
                } catch (certErr) {
                    console.error('[Certificate] Error generating certificate:', certErr);
                    // Non-blocking: allow completion to proceed even if certificate generation fails
                }
            } else {
                console.log(`[Certificate] Certificate already exists for record ${record._id}, skipping generation`);
            }
        } else {
            // Sprint 2: Terminal State Logic
            if (currentAttemptNumber >= assessment.max_attempts) {
                record.status = 'LOCKED';
            } else {
                record.status = 'FAILED';
            }
        }
        await record.save();

        // 6. Post-persistence Actions (Audit & Notifications)
        const metadata = {
            score,
            passed,
            attemptNumber: currentAttemptNumber,
            totalQuestions,
            correctCount,
            completedLate: record.completedLate
        };
        const auditService = await import('../services/auditService');
        await auditService.logAssessmentSubmitted(userId, trainingId, record._id.toString(), assessment._id.toString(), metadata, req);
        await auditService.logAssessmentResult(userId, trainingId, record._id.toString(), assessment._id.toString(), passed, score, req);

        if (record.completedLate) {
            await auditService.logLateCompletion(userId, trainingId, record._id.toString(), req);
        }

        if (record.status !== oldStatus) {
            await (await import('../services/auditService')).logStatusChanged(userId, trainingId, record._id.toString(), oldStatus, record.status, req);
        }

        // Sprint 1/2: No certificate generation
        // Sprint 3: Certificate generation integrated above

        res.status(201).json({
            message: passed ? 'Assessment Passed' : 'Assessment Failed',
            score,
            passed,
            status: record.status,
            attemptNumber: currentAttemptNumber,
            maxAttempts: assessment.max_attempts,
            // Sprint 3: Certificate & Expiry fields
            certificateId: record.certificateId || null,
            certificateUrl: record.certificateUrl || null,
            expiryDate: record.expiryDate || null
        });

    } catch (error) {
        console.error('Submit Assessment Error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};
