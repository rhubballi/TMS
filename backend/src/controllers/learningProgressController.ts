import { Response } from 'express';
import LearningProgress from '../models/LearningProgress';
import TrainingRecord from '../models/TrainingRecord';
import TrainingContentMapping from '../models/TrainingContentMapping';
import { AuthRequest } from '../types/express';

// @desc    Get learning progress for user's training records
// @route   GET /api/learning-progress/my
// @access  Private
export const getMyLearningProgress = async (req: AuthRequest, res: Response) => {
  try {
    const progress = await LearningProgress.find({ user: req.user!._id })
      .populate({
        path: 'trainingRecord',
        populate: {
          path: 'training',
          select: 'title code description type'
        }
      })
      .sort({ 'overallProgress.lastActivityAt': -1 });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get learning progress for specific training record
// @route   GET /api/learning-progress/:trainingRecordId
// @access  Private
export const getLearningProgress = async (req: AuthRequest, res: Response) => {
  try {
    const progress = await LearningProgress.findOne({
      trainingRecord: req.params.trainingRecordId,
      user: req.user!._id
    }).populate({
      path: 'trainingRecord',
      populate: [
        { path: 'training', select: 'title code description type validityPeriod content' },
        { path: 'trainingMaster', select: 'title training_code description content' }
      ]
    });

    if (!progress) {
      // Create initial progress if it doesn't exist
      const trainingRecord = await TrainingRecord.findById(req.params.trainingRecordId);
      if (!trainingRecord || trainingRecord.user.toString() !== req.user!._id.toString()) {
        return res.status(404).json({ message: 'Training record not found' });
      }

      const newProgress = await createInitialProgress(trainingRecord._id.toString(), req.user!._id.toString());
      return res.json(newProgress);
    }

    // Backfill fileUrl if missing (Self-healing)
    let progressModified = false;
    const trainingRecord = progress.trainingRecord as any;

    if (trainingRecord) {
      progress.contentItems.forEach(item => {
        if (!item.fileUrl) {
          // Try to find fileUrl from Training or TrainingMaster
          const trainingContent = trainingRecord.training?.content;
          const masterContent = trainingRecord.trainingMaster?.content; // Assuming Master has similar structure or mapping

          // Logic to find matching content or default to main content
          // For simplified 1-doc workflow:
          if (trainingContent && trainingContent.fileUrl) {
            item.fileUrl = trainingContent.fileUrl;
            progressModified = true;
          } else if (trainingRecord.training?.fileUrl) {
            // Legacy/Adhoc fallback
            item.fileUrl = trainingRecord.training.fileUrl;
            progressModified = true;
          }
        }
      });
    }

    if (progressModified) {
      await progress.save();
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Update reading progress
// @route   PUT /api/learning-progress/:trainingRecordId/content/:contentId
// @access  Private
export const updateReadingProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { trainingRecordId, contentId } = req.params;
    const { pageNumber, sectionId, timeSpent, isCompleted } = req.body;

    let progress = await LearningProgress.findOne({
      trainingRecord: trainingRecordId,
      user: req.user!._id
    });

    if (!progress) {
      const trainingRecord = await TrainingRecord.findById(trainingRecordId);
      if (!trainingRecord || trainingRecord.user.toString() !== req.user!._id.toString()) {
        return res.status(404).json({ message: 'Training record not found' });
      }
      progress = await createInitialProgress(trainingRecord._id.toString(), req.user!._id.toString());
    }

    // Find the content item
    const contentItem = progress.contentItems.find(item => item.contentId === contentId);
    if (!contentItem) {
      return res.status(404).json({ message: 'Content item not found' });
    }

    // Update progress
    contentItem.lastAccessedAt = new Date();
    contentItem.timeSpent += timeSpent || 0;

    if (pageNumber !== undefined) {
      contentItem.lastPageRead = pageNumber;

      // Update page progress
      const pageProgress = contentItem.pageProgress.find(p => p.pageNumber === pageNumber);
      if (pageProgress) {
        pageProgress.accessedAt = new Date();
        pageProgress.timeSpent += timeSpent || 0;
      } else {
        contentItem.pageProgress.push({
          pageNumber,
          accessedAt: new Date(),
          timeSpent: timeSpent || 0,
        });
      }
    }

    if (sectionId) {
      contentItem.lastSectionRead = sectionId;

      // Update section progress
      const sectionProgress = contentItem.sectionProgress.find(s => s.sectionId === sectionId);
      if (sectionProgress) {
        sectionProgress.timeSpent += timeSpent || 0;
        if (isCompleted && !sectionProgress.isCompleted) {
          sectionProgress.isCompleted = true;
          sectionProgress.completedAt = new Date();
        }
      } else {
        contentItem.sectionProgress.push({
          sectionId,
          sectionTitle: sectionId, // This should be provided by frontend
          isCompleted: isCompleted || false,
          completedAt: isCompleted ? new Date() : undefined,
          timeSpent: timeSpent || 0,
        });
      }
    }

    // Check if content item is completed
    if (isCompleted && !contentItem.isCompleted) {
      contentItem.isCompleted = true;
      contentItem.completedAt = new Date();
    }

    // Update overall progress
    progress.overallProgress.completedContentItems = progress.contentItems.filter(item => item.isCompleted).length;
    progress.overallProgress.totalTimeSpent = progress.contentItems.reduce((total, item) => total + item.timeSpent, 0);
    progress.overallProgress.lastActivityAt = new Date();

    // Check if assessment is ready (all content completed)
    const allContentCompleted = progress.contentItems.every(item => item.isCompleted);
    if (allContentCompleted && !progress.assessmentReady) {
      progress.assessmentReady = true;
      progress.assessmentReadyAt = new Date();
    }

    await progress.save();

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Get resume point for training
// @route   GET /api/learning-progress/:trainingRecordId/resume
// @access  Private
export const getResumePoint = async (req: AuthRequest, res: Response) => {
  try {
    const progress = await LearningProgress.findOne({
      trainingRecord: req.params.trainingRecordId,
      user: req.user!._id
    });

    if (!progress) {
      return res.json({
        hasProgress: false,
        resumePoint: null,
        nextAction: 'start'
      });
    }

    // Find the first incomplete content item or the last accessed one
    const incompleteItems = progress.contentItems.filter(item => !item.isCompleted);
    const lastAccessedItem = progress.contentItems
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())[0];

    let resumePoint = null;
    let nextAction = 'continue';

    if (incompleteItems.length > 0) {
      const nextItem = incompleteItems[0];
      resumePoint = {
        contentId: nextItem.contentId,
        contentType: nextItem.contentType,
        title: nextItem.title,
        lastPageRead: nextItem.lastPageRead,
        lastSectionRead: nextItem.lastSectionRead,
      };
    } else if (progress.assessmentReady) {
      nextAction = 'assessment';
    } else {
      nextAction = 'completed';
    }

    res.json({
      hasProgress: true,
      resumePoint,
      nextAction,
      overallProgress: progress.overallProgress,
      assessmentReady: progress.assessmentReady,
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// Helper function to create initial progress
const createInitialProgress = async (trainingRecordId: string, userId: string) => {
  const trainingRecord = await TrainingRecord.findById(trainingRecordId)
    .populate('training')
    .populate('trainingMaster');

  if (!trainingRecord) {
    throw new Error('Training record not found');
  }

  // Check if there's a temporary content mapping for the TrainingMaster
  let contentItems: any[] = [];

  if (trainingRecord.trainingMaster) {
    const mapping = await TrainingContentMapping.findOne({
      training_master_id: (trainingRecord.trainingMaster as any)._id,
      active: true
    });

    if (mapping) {
      contentItems.push({
        contentId: mapping._id.toString(),
        contentType: mapping.content_type === 'PDF' ? 'document' : 'link', // Map to existing types
        title: (trainingRecord.trainingMaster as any).title || 'Training Content',
        fileUrl: mapping.content_source,
        isCompleted: false,
        lastAccessedAt: new Date(),
        timeSpent: 0
      });
    }
  }

  // Fallback to existing training content if no mapping or if it's a legacy record
  if (contentItems.length === 0 && trainingRecord.training) {
    contentItems.push({
      contentId: trainingRecord.training._id.toString(),
      contentType: 'document',
      title: (trainingRecord.training as any)?.title || 'Training Document',
      fileUrl: (trainingRecord.training as any).content?.fileUrl || (trainingRecord.training as any).fileUrl,
      totalPages: 1, // This should be determined by the actual document
      isCompleted: false,
      lastAccessedAt: new Date(),
      timeSpent: 0,
      pageProgress: [],
      sectionProgress: [],
    });
  }

  if (contentItems.length === 0) {
    // If absolutely no content, create a dummy placeholder to avoid breaking the UI
    contentItems.push({
      contentId: 'placeholder',
      contentType: 'document',
      title: 'No Content Available',
      isCompleted: false,
      lastAccessedAt: new Date(),
      timeSpent: 0
    });
  }

  const progress = new LearningProgress({
    trainingRecord: trainingRecordId,
    user: userId,
    contentItems,
    overallProgress: {
      totalContentItems: contentItems.length,
      completedContentItems: 0,
      totalTimeSpent: 0,
      lastActivityAt: new Date(),
    },
    assessmentReady: false,
  });

  await progress.save();
  return progress;
};