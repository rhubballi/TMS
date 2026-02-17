import { Response } from 'express';
import TrainingMaster from '../models/TrainingMaster';
import TrainingRecord from '../models/TrainingRecord';
import User from '../models/User';
// Notification removed

import { AuthRequest } from '../types/express';

// @desc    Create new training master entry
// @route   POST /api/training-master
// @access  Private (Admin/QA)
export const createTrainingMaster = async (req: AuthRequest, res: Response) => {
    try {
        const { training_code, title, description, training_type, mandatory_flag, validity_period, validity_unit } = req.body;

        // Validation for unique code is handled by Mongoose unique index, 
        // but we can check explicitly for better error message
        const existing = await TrainingMaster.findOne({ training_code });
        if (existing) {
            res.status(400).json({ message: `Training code "${training_code}" already exists.` });
            return;
        }

        const trainingMaster = await TrainingMaster.create({
            training_code,
            title,
            description,
            training_type,
            mandatory_flag,
            validity_period,
            validity_unit,
            created_by: req.user!._id
        });

        res.status(201).json(trainingMaster);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get all training master entries
// @route   GET /api/training-master
// @access  Private
export const getTrainingMasters = async (req: AuthRequest, res: Response) => {
    try {
        const trainings = await TrainingMaster.find({}).populate('created_by', 'name email');
        res.json(trainings);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Update training master entry
// @route   PUT /api/training-master/:id
// @access  Private (Admin/QA)
export const updateTrainingMaster = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const training = await TrainingMaster.findById(id);

        if (!training) {
            res.status(404).json({ message: 'Training Master entry not found' });
            return;
        }

        const updated = await TrainingMaster.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Toggle training master status (ACTIVE/INACTIVE)
// @route   PATCH /api/training-master/:id/status
// @access  Private (Admin/QA)
export const toggleTrainingMasterStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const training = await TrainingMaster.findById(id);

        if (!training) {
            res.status(404).json({ message: 'Training Master entry not found' });
            return;
        }

        training.status = training.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await training.save();

        res.json(training);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const assignTrainingMaster = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // TrainingMaster ID
        const { departments, assignedUsers, dueDate } = req.body;

        const trainingMaster = await TrainingMaster.findById(id);
        if (!trainingMaster) {
            res.status(404).json({ message: 'Training Master not found' });
            return;
        }

        let targetUserIds: string[] = [];
        if (departments && departments.length > 0) {
            const users = await User.find({ department: { $in: departments } });
            targetUserIds = users.map(u => u._id.toString());
        } else if (assignedUsers === 'ALL') {
            const users = await User.find({});
            targetUserIds = users.map(u => u._id.toString());
        } else if (Array.isArray(assignedUsers)) {
            targetUserIds = assignedUsers;
        }

        if (targetUserIds.length === 0) {
            res.status(400).json({ message: 'No users selected or found for assignment' });
            return;
        }

        const effectiveDueDate = new Date(dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000);

        const createdRecords = [];
        for (const uid of targetUserIds) {
            // Check if record already exists and is active? (Optional improvement)
            const record = await TrainingRecord.create({
                user: uid,
                trainingMaster: trainingMaster._id,
                status: 'PENDING',
                dueDate: effectiveDueDate,
                assignmentSource: 'manual',
                assignedBy: req.user!._id
            });
            createdRecords.push(record);

            // Notification removed
        }

        res.status(201).json({
            message: `Assigned to ${createdRecords.length} users`,
            count: createdRecords.length
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
