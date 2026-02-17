import { Request, Response } from 'express';
import TrainingRecord from '../models/TrainingRecord';
import { logAuditEvent } from '../services/auditService';
import { AuditEventType, EventSource } from '../models/TrainingAuditLog';

/**
 * Get training matrix (Admin/QA only)
 * URS-TMS-S3-011: Read-only compliance view
 * Sprint 3: Training Matrix implementation
 */
export const getTrainingMatrix = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        // Role check: Admin or QA only
        if (!['Administrator', 'QA'].includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Admin/QA only.' });
        }

        // Audit log access
        await logAuditEvent({
            event_type: AuditEventType.MATRIX_ACCESSED,
            user_id: user._id,
            event_source: EventSource.ADMIN,
            metadata: { action: 'MATRIX_ACCESSED', timestamp: new Date().toISOString() },
            req
        });

        // Fetch all training records with populated data
        const matrix = await TrainingRecord.find()
            .populate('user', 'name email department')
            .populate('training', 'title code version')
            .populate('trainingMaster', 'title training_code')
            .select('status score passed assessmentAttempts dueDate completedDate certificateId certificateUrl expiryDate completedLate')
            .sort({ 'user.department': 1, 'user.name': 1 })
            .lean();

        res.json({
            success: true,
            count: matrix.length,
            data: matrix
        });

    } catch (error) {
        console.error('[TrainingMatrix] Error:', error);
        res.status(500).json({ message: 'Failed to fetch training matrix' });
    }
};

/**
 * Export training matrix (CSV)
 * URS-TMS-S3-012: Export audit logging
 * Sprint 3: Training Matrix export
 */
export const exportTrainingMatrix = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        // Role check
        if (!['Administrator', 'QA'].includes(user.role)) {
            return res.status(403).json({ message: 'Access denied. Admin/QA only.' });
        }

        // Filtering from Query Params
        const { department, fromDate, toDate } = req.query;

        // Audit log export
        await logAuditEvent({
            event_type: AuditEventType.MATRIX_EXPORTED,
            user_id: user._id,
            event_source: EventSource.ADMIN,
            metadata: {
                action: 'MATRIX_EXPORTED',
                format: 'CSV',
                timestamp: new Date().toISOString(),
                filters: { department, fromDate, toDate }
            },
            req
        });

        let matrix = await TrainingRecord.find()
            .populate('user', 'name email department')
            .populate('training', 'title code version')
            .populate('trainingMaster', 'title training_code')
            .select('status score passed assessmentAttempts dueDate completedDate certificateId expiryDate assignedDate') // Added assignedDate for filtering
            .lean();

        // Apply Filters (In-Memory to match Analytics Logic)
        if (department && typeof department === 'string' && department !== 'All Departments') {
            matrix = matrix.filter(r => {
                const u = r.user as any;
                return u && u.department === department;
            });
        }

        if (fromDate && toDate) {
            const start = new Date(fromDate as string);
            const end = new Date(toDate as string);

            matrix = matrix.filter(r => {
                const completed = r.completedDate ? new Date(r.completedDate) : null;
                const due = r.dueDate ? new Date(r.dueDate) : null;
                const assigned = (r as any).assignedDate ? new Date((r as any).assignedDate) : null;

                const isCompletedInRange = completed && completed >= start && completed <= end;
                const isDueInRange = due && due >= start && due <= end;
                const isAssignedInRange = assigned && assigned >= start && assigned <= end;

                return isCompletedInRange || isDueInRange || isAssignedInRange;
            });
        }

        // Convert to CSV
        const csv = convertToCSV(matrix);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=training-matrix.csv');
        res.send(csv);

    } catch (error) {
        console.error('[TrainingMatrix] Export error:', error);
        res.status(500).json({ message: 'Failed to export training matrix' });
    }
};

/**
 * Helper function to convert training matrix data to CSV format
 */
function convertToCSV(data: any[]): string {
    const headers = [
        'User Name',
        'Email',
        'Department',
        'Training Title',
        'Training Code',
        'Status',
        'Score',
        'Passed',
        'Attempts',
        'Due Date',
        'Completed Date',
        'Completed Late',
        'Certificate ID',
        'Expiry Date'
    ];

    const rows = data.map(r => [
        r.user?.name || 'N/A',
        r.user?.email || 'N/A',
        r.user?.department || 'N/A',
        r.training?.title || r.trainingMaster?.title || 'N/A',
        r.training?.code || r.trainingMaster?.training_code || 'N/A',
        r.status,
        r.score !== undefined ? r.score : 'N/A',
        r.passed !== undefined ? (r.passed ? 'Yes' : 'No') : 'N/A',
        r.assessmentAttempts,
        r.dueDate ? new Date(r.dueDate).toLocaleDateString() : 'N/A',
        r.completedDate ? new Date(r.completedDate).toLocaleDateString() : 'N/A',
        r.completedLate ? 'Yes' : 'No',
        r.certificateId || 'N/A',
        r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : 'N/A'
    ]);

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    const csvRows = [
        headers.join(','),
        ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ];

    return csvRows.join('\n');
}
