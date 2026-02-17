import { Response } from 'express';
import Training from '../models/Training';
import { AuthRequest } from '../types/express';

// @desc    Create new training
// @route   POST /api/trainings
// @access  Private (Admin/QA)
export const createTraining = async (req: AuthRequest, res: Response) => {
    const { code, title, description, purpose, type, mandatory } = req.body;

    try {
        const training = await Training.create({
            code,
            title,
            description,
            purpose,
            type,
            mandatory,
            createdBy: req.user!._id,
        });

        res.status(201).json(training);
    } catch (error: any) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'A training with this code already exists.' });
            return;
        }
        res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

// @desc    Get all trainings
// @route   GET /api/trainings
// @access  Private
export const getTrainings = async (req: AuthRequest, res: Response) => {
    try {
        const trainings = await Training.find({}).populate('createdBy', 'name');
        res.json(trainings);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get training by ID
// @route   GET /api/trainings/:id
// @access  Private
export const getTraining = async (req: AuthRequest, res: Response) => {
    try {
        const training = await Training.findById(req.params.id).populate('createdBy', 'name');
        if (!training) {
            res.status(404).json({ message: 'Training not found' });
            return;
        }
        res.json(training);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Update training
// @route   PUT /api/trainings/:id
// @access  Private (Admin/QA)
export const updateTraining = async (req: AuthRequest, res: Response) => {
    try {
        const training = await Training.findById(req.params.id);
        if (!training) {
            res.status(404).json({ message: 'Training not found' });
            return;
        }

        const updatedTraining = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTraining);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Delete training
// @route   DELETE /api/trainings/:id
// @access  Private (Admin/QA)
export const deleteTraining = async (req: AuthRequest, res: Response) => {
    try {
        const training = await Training.findById(req.params.id);
        if (!training) {
            res.status(404).json({ message: 'Training not found' });
            return;
        }

        await Training.findByIdAndDelete(req.params.id);
        res.json({ message: 'Training removed' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};