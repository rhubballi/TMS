import { Response } from 'express';
import DocumentLink from '../models/DocumentLink';
import Training from '../models/Training';
import { AuthRequest } from '../types/express';

// @desc    Link training to document
// @route   POST /api/document-links
// @access  Private (Admin/QA)
export const createDocumentLink = async (req: AuthRequest, res: Response) => {
    const { trainingId, documentId, documentVersionId, versionString, effectiveDate, isPrimary } = req.body;

    try {
        // Verify training exists
        const training = await Training.findById(trainingId);
        if (!training) {
            res.status(404).json({ message: 'Training not found' });
            return;
        }

        // TODO: Validate document version is effective in DMS

        const documentLink = await DocumentLink.create({
            training: trainingId,
            documentId,
            documentVersionId,
            versionString,
            effectiveDate,
            isPrimary,
            linkedBy: req.user!._id,
        });

        res.status(201).json(documentLink);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get document links for training
// @route   GET /api/document-links/:trainingId
// @access  Private
export const getDocumentLinks = async (req: AuthRequest, res: Response) => {
    try {
        const documentLinks = await DocumentLink.find({ training: req.params.trainingId })
            .populate('linkedBy', 'name')
            .sort({ createdAt: -1 });
        res.json(documentLinks);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Update document link
// @route   PUT /api/document-links/:id
// @access  Private (Admin/QA)
export const updateDocumentLink = async (req: AuthRequest, res: Response) => {
    try {
        const documentLink = await DocumentLink.findById(req.params.id);
        if (!documentLink) {
            res.status(404).json({ message: 'Document link not found' });
            return;
        }

        const updatedLink = await DocumentLink.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedLink);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Delete document link
// @route   DELETE /api/document-links/:id
// @access  Private (Admin/QA)
export const deleteDocumentLink = async (req: AuthRequest, res: Response) => {
    try {
        const documentLink = await DocumentLink.findById(req.params.id);
        if (!documentLink) {
            res.status(404).json({ message: 'Document link not found' });
            return;
        }

        await DocumentLink.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document link removed' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};