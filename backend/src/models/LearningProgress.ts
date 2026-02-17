import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningProgress extends Document {
  trainingRecord: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;

  // Content progress tracking
  contentItems: {
    contentId: string; // Unique identifier for the content item (document ID, module ID, etc.)
    contentType: 'document' | 'module' | 'section' | 'lesson';
    title: string;
    fileUrl?: string; // URL for the content file (PDF, etc.)
    totalPages?: number; // For documents
    totalSections?: number; // For modules

    // Reading progress
    isCompleted: boolean;
    completedAt?: Date;
    lastAccessedAt: Date;
    lastPageRead?: number; // For documents
    lastSectionRead?: string; // For modules
    timeSpent: number; // Total time spent in seconds

    // Detailed tracking
    pageProgress: {
      pageNumber: number;
      accessedAt: Date;
      timeSpent: number; // Time spent on this page
    }[];

    sectionProgress: {
      sectionId: string;
      sectionTitle: string;
      isCompleted: boolean;
      completedAt?: Date;
      timeSpent: number;
    }[];
  }[];

  // Overall progress
  overallProgress: {
    totalContentItems: number;
    completedContentItems: number;
    totalTimeSpent: number;
    lastActivityAt: Date;
    estimatedCompletionTime?: number; // In minutes
  };

  // Assessment readiness
  assessmentReady: boolean;
  assessmentReadyAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const LearningProgressSchema: Schema = new Schema({
  trainingRecord: { type: Schema.Types.ObjectId, ref: 'TrainingRecord', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  contentItems: [{
    contentId: { type: String, required: true },
    contentType: { type: String, enum: ['document', 'module', 'section', 'lesson'], required: true },
    title: { type: String, required: true },
    fileUrl: { type: String },
    totalPages: { type: Number },
    totalSections: { type: Number },

    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastAccessedAt: { type: Date, default: Date.now },
    lastPageRead: { type: Number },
    lastSectionRead: { type: String },
    timeSpent: { type: Number, default: 0 },

    pageProgress: [{
      pageNumber: { type: Number, required: true },
      accessedAt: { type: Date, default: Date.now },
      timeSpent: { type: Number, default: 0 },
    }],

    sectionProgress: [{
      sectionId: { type: String, required: true },
      sectionTitle: { type: String, required: true },
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date },
      timeSpent: { type: Number, default: 0 },
    }],
  }],

  overallProgress: {
    totalContentItems: { type: Number, default: 0 },
    completedContentItems: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
    estimatedCompletionTime: { type: Number },
  },

  assessmentReady: { type: Boolean, default: false },
  assessmentReadyAt: { type: Date },
}, {
  timestamps: true,
});

// Indexes for efficient queries
LearningProgressSchema.index({ trainingRecord: 1, user: 1 }, { unique: true });
LearningProgressSchema.index({ user: 1, 'overallProgress.lastActivityAt': -1 });

export default mongoose.model<ILearningProgress>('LearningProgress', LearningProgressSchema);