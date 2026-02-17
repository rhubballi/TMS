import { Request, Response } from 'express';
import TrainingContentMapping from '../models/TrainingContentMapping';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
    user?: any;
    file?: any;
}

export const attachTrainingContent = async (req: AuthRequest, res: Response) => {
    try {
        const { training_master_id, content_type, content_source } = req.body;

        let finalSource = content_source;

        // If it's a PDF upload, we use the file path
        if (content_type === 'PDF' && req.file) {
            finalSource = `/uploads/${req.file.filename}`;
        }

        if (!finalSource) {
            res.status(400).json({ message: 'Content source is required' });
            return;
        }

        // Deactivate existing mapping for this Training Master
        await TrainingContentMapping.updateMany(
            { training_master_id, active: true },
            { $set: { active: false } }
        );

        // Create new mapping (Append-only)
        const mapping = await TrainingContentMapping.create({
            training_master_id,
            content_type,
            content_source: finalSource,
            read_only_flag: true,
            active: true
        });

        res.status(201).json(mapping);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getTrainingContent = async (req: Request, res: Response) => {
    try {
        const { training_master_id } = req.params;
        const mapping = await TrainingContentMapping.findOne({ training_master_id, active: true });

        if (!mapping) {
            res.status(404).json({ message: 'No content found for this training' });
            return;
        }

        res.json(mapping);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
