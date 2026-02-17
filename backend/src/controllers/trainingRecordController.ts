import { Response, Request } from 'express';
import TrainingRecord from '../models/TrainingRecord';
import Training from '../models/Training';
import TrainingMaster from '../models/TrainingMaster';
import TrainingSession from '../models/TrainingSession';
import Notification from '../models/Notification';
import User from '../models/User';
import { AuthRequest } from '../types/express';
// Notification removed

import LearningProgress from '../models/LearningProgress';
import { sendDocumentAssignmentEmail } from '../services/emailService';
import {
    logTrainingAssigned,
    logStatusChanged,
    logRejectedTransition,
    logDocumentViewed,
    logDocumentAcknowledged
} from '../services/auditService';
import fs from 'fs';
import { generateCertificateId, generateCertificatePDF } from '../services/certificateService';
import { sendNotification } from '../services/notificationService';

// Helper to refresh OVERDUE status (URS-TMS-S2-021/022)
export const refreshTrainingStatus = async (record: any, req?: Request) => {
    if (['PENDING', 'IN_PROGRESS'].includes(record.status)) {
        const now = new Date();
        if (record.dueDate && record.dueDate < now) {
            const oldStatus = record.status;
            record.status = 'OVERDUE';
            await record.save();
            console.log(`Record ${record._id} marked as OVERDUE (System Auto-Detection)`);

            // Use Dedicated Overdue Audit Event (Sprint 2)
            const { logTrainingOverdue } = await import('../services/auditService');
            await logTrainingOverdue(
                record.user.toString(),
                record.training.toString(),
                record._id.toString()
            );
        }
    }
    return record;
};

// @desc    Assign training to user(s)
// @route   POST /api/training-records
// @access  Private (Admin/QA)
export const assignTraining = async (req: AuthRequest, res: Response) => {
    const { userIds, departments, targetAudience, trainingId, dueDate, assignmentSource = 'manual' } = req.body;

    try {
        const training = await Training.findById(trainingId);
        if (!training) {
            res.status(404).json({ message: 'Training not found' });
            return;
        }

        let targetUserIds: string[] = [];

        if (targetAudience === 'ALL') {
            const allUsers = await User.find({});
            targetUserIds = allUsers.map(u => u._id.toString());
        } else if (departments && Array.isArray(departments) && departments.length > 0) {
            const usersInDepts = await User.find({ department: { $in: departments } });
            targetUserIds = usersInDepts.map(u => u._id.toString());
        } else if (Array.isArray(userIds) && userIds.length > 0) {
            targetUserIds = userIds;
        } else if (req.body.userId) {
            // Backward compatibility
            targetUserIds = [req.body.userId];
        }

        if (targetUserIds.length === 0) {
            res.status(400).json({
                message: 'No users found matching the assignment criteria. Please ensure users have been created and assigned to departments.'
            });
            return;
        }

        const createdRecords = [];
        const errors = [];

        for (const uid of targetUserIds) {
            // Check if already assigned
            const existing = await TrainingRecord.findOne({ user: uid, training: trainingId, status: { $ne: 'OVERDUE' } });
            if (existing) {
                continue; // Skip if already assigned
            }

            try {
                // Try to find if there is a primary document link for this training
                // This is optional if we just use training.version, but good for linking
                // We don't have DocumentLink imported here yet, so we might skip explicit linking if not critical
                // Or we can simple rely on Training-based lookup.
                // For now, let's create the record.

                const record = await TrainingRecord.create({
                    user: uid,
                    training: trainingId,
                    dueDate,
                    assignmentSource,
                    assignedBy: req.user!._id,
                    status: 'PENDING'
                });

                createdRecords.push(record);

                try {
                    // Safe cast to access trainingMaster which might not be in ITraining type definition yet
                    const trainingAny = training as any;
                    await logTrainingAssigned(
                        uid,
                        training._id.toString(),
                        record._id.toString(),
                        {
                            dueDate,
                            assignedBy: req.user!._id
                        },
                        req
                    );
                } catch (logErr) {
                    console.error('Audit logging failed:', logErr);
                }

                // Send Notification (Centralized)
                try {
                    // We cast training to any to access title safely
                    const trainingTitle = (training as any).title;
                    await sendNotification(uid, 'TRAINING_ASSIGNED', {
                        trainingTitle: trainingTitle,
                        dueDate: new Date(dueDate)
                    });
                } catch (notiErr) {
                    console.error(`Failed to send notification to user ${uid}:`, notiErr);
                }

            } catch (err: any) {
                errors.push({ userId: uid, error: err.message });
            }
        }

        res.status(201).json({
            message: `Assigned training to ${createdRecords.length} users`,
            createdCount: createdRecords.length,
            errors
        });

    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get user's training records
// @route   GET /api/training-records/my
// @access  Private
export const getMyTrainingRecords = async (req: AuthRequest, res: Response) => {
    try {
        const records = await TrainingRecord.find({ user: req.user!._id })
            .populate('training', 'title code type mandatory')
            .populate('trainingMaster', 'title training_code')
            .populate('documentLink', 'documentId versionString effectiveDate')
            .sort({ dueDate: 1 });

        // Refresh statuses on-the-fly
        await Promise.all(records.map(r => refreshTrainingStatus(r)));

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get all training records (Admin)
// @route   GET /api/training-records
// @access  Private (Admin/QA)
export const getTrainingRecords = async (req: AuthRequest, res: Response) => {
    try {
        const records = await TrainingRecord.find({})
            .populate('user', 'name email department')
            .populate('training', 'title code version')
            .populate('trainingMaster', 'title training_code')
            .populate('assignedBy', 'name')
            .sort({ createdAt: -1 });

        // Refresh statuses on-the-fly
        await Promise.all(records.map(r => refreshTrainingStatus(r)));

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Start training
// @route   PUT /api/training-records/:id/start
// @access  Private
// @desc    Start training and create session
// @route   PUT /api/training-records/:id/start
// @access  Private
export const startTraining = async (req: AuthRequest, res: Response) => {
    try {
        console.log(`Starting training for record: ${req.params.id}`);
        const record = await TrainingRecord.findById(req.params.id).populate('training');
        if (!record || record.user.toString() !== req.user!._id.toString()) {
            console.log('Record not found or unauthorized');
            res.status(404).json({ message: 'Training record not found' });
            return;
        }

        // Enforce Status Rules
        if (record.status === 'LOCKED') {
            await logRejectedTransition(req.user!._id.toString(), record._id.toString(), 'START_TRAINING', 'Training is LOCKED', {}, req);
            res.status(403).json({ message: 'Training is LOCKED due to maximum failed attempts. Please contact Admin.' });
            return;
        }
        if (record.status === 'OVERDUE') {
            await logRejectedTransition(req.user!._id.toString(), record._id.toString(), 'START_TRAINING', 'Training is OVERDUE', {}, req);
            res.status(403).json({ message: 'Training is OVERDUE. Please contact Admin.' });
            return;
        }
        if (record.status === 'COMPLETED') {
            await logRejectedTransition(req.user!._id.toString(), record._id.toString(), 'START_TRAINING', 'Training is already COMPLETED', {}, req);
            res.status(400).json({ message: 'Training already completed' });
            return;
        }

        // URS-TMS-S2-018: Document must be acknowledged before starting session
        if (!record.documentAcknowledged) {
            await logRejectedTransition(req.user!._id.toString(), record._id.toString(), 'START_TRAINING', 'DOC_NOT_ACKNOWLEDGED', {}, req);
            res.status(403).json({ message: 'Access denied: You must acknowledge the training document before starting the session.' });
            return;
        }

        // Allow starting if PENDING, IN_PROGRESS or FAILED (retry)
        if (record.status !== 'PENDING' && record.status !== 'FAILED') {
            // If already IN_PROGRESS, find existing session
            if (record.status === 'IN_PROGRESS') {
                const existingSession = await TrainingSession.findOne({
                    trainingRecord: record._id
                }).sort({ createdAt: -1 }); // Get latest

                // Check if the finding session is already completed (which shouldn't happen for IN_PROGRESS unless consistency error)
                if (existingSession && existingSession.status !== 'completed') {
                    console.log('Resuming existing session');
                    res.json({
                        record,
                        sessionId: existingSession._id
                    });
                    return;
                }
                // If no session found OR latest session is COMPLETED, treat as new attempt
                console.log('Status IN_PROGRESS but latest session is missing or completed. Creating new session.');
            } else {
                res.status(400).json({ message: 'Training already completed or in progress' });
                return;
            }
        }

        record.status = 'IN_PROGRESS';
        record.startedDate = new Date();
        await record.save();

        // LOG AUDIT: Status Change (Sprint 2)
        await logStatusChanged(
            record.user.toString(),
            record.training.toString(),
            record._id.toString(),
            'PENDING',
            'IN_PROGRESS',
            req
        );

        // Create a new Training Session for this attempt
        // We need to cast record.training to any or ITraining because populate type inference can be tricky
        const training = record.training as any;
        const trainingContent = training.content;

        if (!trainingContent) {
            console.error('Training content missing for training:', training._id);
            res.status(500).json({ message: 'Training content structure is missing. Please contact admin.' });
            return;
        }

        console.log('Creating session with content:', { fileName: trainingContent.fileName, questions: trainingContent.questions ? 'present' : 'missing' });

        let session = null;
        if (trainingContent) {
            // Map questions to match TrainingSession schema
            const sessionQuestions = {
                mcq: trainingContent.questions?.mcq?.map((q: any) => ({
                    question: q.question,
                    options: q.options,
                    answer: q.correctAnswer // Map correctAnswer to answer
                })) || [],
                shortAnswer: trainingContent.questions?.shortAnswer?.map((q: any) => q.question) || [],
                trueFalse: trainingContent.questions?.trueFalse?.map((q: any) => ({
                    question: q.question,
                    answer: q.answer
                })) || []
            };

            session = await TrainingSession.create({
                fileName: trainingContent.fileName || 'Untitled',
                documentText: trainingContent.text || '',
                questions: sessionQuestions,
                user: req.user!._id,
                trainingRecord: record._id,
                fileUrl: trainingContent.fileUrl || ''
            });

            // Initialize progress logic idempotently (LearningProgress) (URS-TMS-S2-016)
            await LearningProgress.findOneAndUpdate(
                {
                    trainingRecord: record._id,
                    user: req.user!._id
                },
                {
                    $setOnInsert: {
                        trainingRecord: record._id,
                        user: req.user!._id,
                        contentItems: [{
                            contentId: `doc-${Date.now()}`,
                            contentType: 'document',
                            title: trainingContent.fileName || 'Document',
                            totalPages: 1,
                            isCompleted: false,
                            lastAccessedAt: new Date(),
                            timeSpent: 0
                        }],
                        overallProgress: {
                            totalContentItems: 1,
                            completedContentItems: 0,
                            totalTimeSpent: 0,
                            lastActivityAt: new Date()
                        },
                        assessmentReady: true,
                        assessmentReadyAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );
            console.log("Learning progress handled idempotently.");
        }

        res.json({
            record,
            sessionId: session ? session._id : null
        });
    } catch (error) {
        console.error('Error in startTraining:', error);
        const logMessage = `${new Date().toISOString()} - startTraining Error: ${(error as Error).message}\nStack: ${(error as Error).stack}\n\n`;
        // Use fs from 'fs' (ensure fs is imported if not already, checked file it is imported at top)
        try { require('fs').appendFileSync('server_error.log', logMessage); } catch (e) { console.error("Log write failed", e); }
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Mark document as viewed
// @route   PUT /api/training-records/:id/view-document
// @access  Private
export const viewDocument = async (req: AuthRequest, res: Response) => {
    try {
        const record = await TrainingRecord.findById(req.params.id).populate('training');
        if (!record || record.user.toString() !== req.user!._id.toString()) {
            res.status(404).json({ message: 'Training record not found' });
            return;
        }

        record.documentViewed = true;
        await record.save();

        // LOG AUDIT: Document Viewed (Sprint 1)
        await logDocumentViewed(
            record.user.toString(),
            record.training.toString(),
            record._id.toString(),
            req
        );

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Acknowledge document (Compliant Acknowledgment)
// @route   PUT /api/training-records/:id/acknowledge
// @access  Private
export const acknowledgeDocument = async (req: AuthRequest, res: Response) => {
    try {
        const record = await TrainingRecord.findById(req.params.id);
        if (!record || record.user.toString() !== req.user!._id.toString()) {
            res.status(404).json({ message: 'Training record not found' });
            return;
        }

        if (record.documentAcknowledged) {
            res.status(400).json({ message: 'Document already acknowledged' });
            return;
        }

        record.documentAcknowledged = true;
        record.acknowledgedAt = new Date();
        await record.save();

        // LOG AUDIT: Document Acknowledged (Sprint 1)
        await logDocumentAcknowledged(
            record.user.toString(),
            record.training.toString(),
            record._id.toString(),
            req
        );

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Complete training
// @route   PUT /api/training-records/:id/complete
// @access  Private
export const completeTraining = async (req: AuthRequest, res: Response) => {
    const { score, passed } = req.body;

    try {
        const record = await TrainingRecord.findById(req.params.id);
        if (!record || record.user.toString() !== req.user!._id.toString()) {
            res.status(404).json({ message: 'Training record not found' });
            return;
        }

        if (!record.documentViewed) {
            res.status(400).json({ message: 'Document must be viewed before completion' });
            return;
        }

        // Sprint 2: Extended Status Logic - Fetch from Assessment Config (Mandatory)
        const assessment = await (await import('../models/Assessment')).default.findOne({ training: record.training });
        if (!assessment) {
            res.status(404).json({ message: 'Assessment configuration not found. Evaluation blocked.' });
            return;
        }
        const MAX_ATTEMPTS = assessment.max_attempts;

        // Update attempts count immediately
        record.assessmentAttempts = (record.assessmentAttempts || 0) + 1;
        record.lastAttemptDate = new Date();
        record.score = score;
        record.passed = passed;

        if (passed) {
            record.status = 'COMPLETED';
            record.completedDate = new Date();

            // URS-TMS-S3-007: Calculate Expiry Date
            // We need to fetch the TrainingMaster via the Training reference or direct link
            try {
                // record.training is an ObjectId, we need to populate it or fetch Training to get trainingMaster
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
                console.error('Error calculating expiry date:', expiryErr);
                // Non-blocking error, log and continue
            }

            // URS-TMS-S3-001/004: Generate Certificate
            try {
                // Ensure we have user and training populated or available
                // We likely need to fetch full objects if not already available in a usable state
                // record.user is likely an ObjectId, record.training is ObjectId (or partial)

                const fullRecord = await TrainingRecord.findById(record._id)
                    .populate('user')
                    .populate({ path: 'training', populate: { path: 'trainingMaster' } });

                if (fullRecord && fullRecord.user && fullRecord.training) {
                    const userObj = fullRecord.user;
                    const trainingObj = fullRecord.training;
                    const masterObj = (trainingObj as any).trainingMaster; // Might be null/undefined

                    // 1. Generate ID
                    const certId = generateCertificateId(userObj, trainingObj);
                    record.certificateId = certId;

                    // 2. Generate PDF
                    // Ensure masterObj is passed safely
                    const pdfPath = await generateCertificatePDF(fullRecord, userObj, trainingObj, masterObj);
                    record.certificateUrl = pdfPath;

                    console.log(`[Certificate] Generated ${certId} at ${pdfPath}`);
                }
            } catch (certErr) {
                console.error('Error generating certificate:', certErr);
                // Non-blocking? Ideally we want this to succeed. 
                // If it fails, we might want to flag it or retry later. 
                // For now, log error but allow completion to proceed.
            }
        } else {
            // FAILED logic
            const oldStatus = record.status;
            if (record.assessmentAttempts >= MAX_ATTEMPTS) {
                record.status = 'LOCKED'; // Terminal failure state
                await logStatusChanged(
                    req.user!._id.toString(),
                    record.training.toString(),
                    record._id.toString(),
                    oldStatus,
                    'LOCKED',
                    req
                );
            } else {
                record.status = 'IN_PROGRESS'; // Remain in progress for retries
            }
        }

        await record.save();

        // Send notification (Centralized)
        try {
            const training = await Training.findById(record.training);
            if (passed) {
                await sendNotification(record.user, 'TRAINING_COMPLETED', {
                    trainingTitle: training?.title || 'Training',
                    score: score
                });
            } else {
                if (record.status === 'LOCKED') {
                    // We don't have a specific LOCKED type yet, treat as FAILED but maybe add context?
                    // For now use FAILED
                    await sendNotification(record.user, 'TRAINING_FAILED', {
                        trainingTitle: training?.title || 'Training',
                        score: score
                    });
                } else {
                    await sendNotification(record.user, 'TRAINING_FAILED', {
                        trainingTitle: training?.title || 'Training',
                        score: score
                    });
                }
            }
        } catch (notificationError) {
            console.error('Error sending completion notification:', notificationError);
        }

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get training records for a specific training and department (Compliance Drill-down)
// @route   GET /api/training-records/compliance/:trainingId/:department
// @access  Private (Admin/QA)
export const getRecordsByTrainingAndDepartment = async (req: AuthRequest, res: Response) => {
    try {
        const { trainingId, department } = req.params;
        console.log(`[Compliance Details] Request received. TrainingID: ${trainingId}, Dept: ${department}`);

        // 1. Find all users in this department
        const allUsersInDept = await User.find({ department }).select('name email department');
        const userIds = allUsersInDept.map(u => u._id);

        // 2. Find records for these users and this training
        const records = await TrainingRecord.find({
            training: trainingId,
            user: { $in: userIds }
        }).populate('training', 'title code version');

        // Refresh statuses on-the-fly
        await Promise.all(records.map(r => refreshTrainingStatus(r)));

        // 3. Combine them: ensure every user in the dept has an entry (real or virtual)
        const results = await Promise.all(allUsersInDept.map(async (user) => {
            const record = records.find(r => r.user.toString() === user._id.toString());

            if (record) {
                // Return real record but inject the full user object
                const recordObj = record.toObject() as any;
                recordObj.user = {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    department: user.department
                };

                // Check for certificate
                return recordObj;
            } else {
                // Create a "virtual" pending record for users not yet assigned(?) 
                // Actually, if it's "Monitor Compliance", they are probably assigned.
                // If they are NOT assigned, we return a virtual record with status 'NOT_ASSIGNED'
                return {
                    _id: `virtual-${user._id}`,
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        department: user.department
                    },
                    status: 'NOT_ASSIGNED',
                    assessmentAttempts: 0,
                    assignedDate: new Date(),
                    dueDate: new Date(),
                    passed: false
                };
            }
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getRecordDocument = async (req: AuthRequest, res: Response) => {
    try {
        const record = await TrainingRecord.findById(req.params.id).populate('documentLink');

        if (!record || record.user.toString() !== req.user!._id.toString()) {
            res.status(404).json({ message: 'Training record not found' });
            return;
        }

        if (!record.documentLink) {
            res.status(404).json({ message: 'No document associated with this record' });
            return;
        }

        res.json(record.documentLink);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get complete training history for audit purposes
// @route   GET /api/training-records/history
// @access  Private (User view self / Admin view all)
export const getTrainingHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const isAdmin = req.user!.role === 'Administrator' || req.user!.role === 'QA';

        // 1. RBAC Filter (URS-TMS-S2-026/027)
        let query: any = {};
        if (!isAdmin) {
            query.user = userId;
        } else {
            // Optional: Support filtering by specific user in Admin view
            if (req.query.userId) {
                query.user = req.query.userId;
            } else if (req.query.email) {
                const User = (await import('../models/User')).default;
                const targetedUser = await User.findOne({ email: req.query.email as string });
                if (targetedUser) query.user = targetedUser._id;
            }
        }

        // 2. Fetch Records (URS-TMS-S2-028)
        // Aggregating only relevant fields to ensure read-only mindset
        const records = await TrainingRecord.find(query)
            .populate('trainingMaster', 'title training_code training_type')
            .populate('training', 'title code type')
            .populate('user', 'name email department')
            .sort({ completedDate: -1, lastAttemptDate: -1 });

        // 3. Document Version Evidence Mapping
        const TrainingContentMapping = (await import('../models/TrainingContentMapping')).default;

        const history = await Promise.all(records.map(async (rec) => {
            const content = await TrainingContentMapping.findOne({
                training_master_id: rec.trainingMaster?._id
            }).sort({ created_at: -1 });

            return {
                id: rec._id,
                trainingMasterId: rec.trainingMaster?._id || rec.training?._id,
                trainingTitle: (rec.trainingMaster as any)?.title || (rec.training as any)?.title || 'Unknown Training',
                trainingCode: (rec.trainingMaster as any)?.training_code || (rec.training as any)?.code || 'N/A',
                documentInfo: content ? {
                    source: content.content_source,
                    type: content.content_type,
                    versionDate: content.created_at
                } : null,
                userName: (rec.user as any)?.name,
                userEmail: (rec.user as any)?.email,
                status: rec.status,
                attempts: rec.assessmentAttempts,
                score: rec.score,
                passed: rec.passed,
                assignedDate: rec.assignedDate,
                dueDate: rec.dueDate,
                completedDate: rec.completedDate,
                completedLate: rec.completedLate,
                lastActivity: rec.lastAttemptDate || rec.startedDate || rec.assignedDate
            };
        }));

        res.json(history);
    } catch (error) {
        console.error('Get Training History Error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};