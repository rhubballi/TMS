import { Response } from 'express';
import { analyzeComplianceData } from '../services/aiAnalyticsService';
import TrainingRecord from '../models/TrainingRecord';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * @desc    Get comprehensive analytics dashboard
 * @route   GET /api/analytics/dashboard
 * @access  Private (Admin/QA Only)
 * @note    STRICT READ-ONLY. No data modifications allowed.
 */
export const getAnalyticsDashboard = async (req: AuthRequest, res: Response) => {
    try {
        // ================================
        // 1️⃣ RBAC ENFORCEMENT (CRITICAL)
        // ================================
        if (!req.user || !['Administrator', 'QA'].includes(req.user.role)) {
            return res.status(403).json({
                message: 'Access denied. Admin/QA only.'
            });
        }

        // ================================
        // 2️⃣ FETCH DATA (READ-ONLY)
        // ================================
        // A. Fetch all relevant records (Read-Only)
        // We use lean() for performance and to ensure we don't accidentally modify Mongoose documents
        let allRecords = await TrainingRecord.find({})
            .populate('training')
            .populate('trainingMaster')
            .populate('user')
            .lean();

        // --- FILTERING ENGINE (Sprint 4 Step 3) ---
        const { department, fromDate, toDate } = req.query;

        // 1. Department Filter
        if (department && typeof department === 'string') {
            allRecords = allRecords.filter(r => {
                const user = r.user as any;
                const userDept = user?.department || 'Unassigned';
                if (department === 'All Departments') return true;
                return userDept === department;
            });
        }

        // 2. Date Range Filter
        // Logic: Include record if 'completedDate' OR 'dueDate' OR 'assignedDate' falls within range
        // This ensures capturing all relevant activity.
        if (fromDate && toDate) {
            const start = new Date(fromDate as string);
            const end = new Date(toDate as string);
            // Adjust end date to end of day if needed, but assuming ISO string calls

            allRecords = allRecords.filter(r => {
                const completed = r.completedDate ? new Date(r.completedDate) : null;
                const due = r.dueDate ? new Date(r.dueDate) : null;
                const assigned = r.assignedDate ? new Date(r.assignedDate) : null;

                const isCompletedInRange = completed && completed >= start && completed <= end;
                const isDueInRange = due && due >= start && due <= end;
                const isAssignedInRange = assigned && assigned >= start && assigned <= end;

                return isCompletedInRange || isDueInRange || isAssignedInRange;
            });
        }

        const totalAssigned = allRecords.length;

        const completedRecords = allRecords.filter(r => r.status === 'COMPLETED');
        const overdueRecords = allRecords.filter(r => r.status === 'OVERDUE');
        const expiredRecords = allRecords.filter(r => r.status === 'EXPIRED');
        const failedRecords = allRecords.filter(r => r.status === 'FAILED');

        // ================================
        // 3️⃣ CORE METRICS
        // ================================

        // Compliance %
        const compliancePercentage =
            totalAssigned > 0
                ? (completedRecords.length / totalAssigned) * 100
                : 0;

        // Overdue %
        const overduePercentage =
            totalAssigned > 0
                ? (overdueRecords.length / totalAssigned) * 100
                : 0;

        // TRUE Expired Count (exclude retrained)
        let trueExpiredCount = 0;

        for (const exp of expiredRecords) {
            const hasNewerCompletion = completedRecords.some(comp =>
                comp.user &&
                exp.user &&
                comp.training &&
                exp.training &&
                (comp.user as any)._id.toString() === (exp.user as any)._id.toString() &&
                // Fallback to trainingMaster if training is missing
                (comp.training as any)?._id?.toString() === (exp.training as any)?._id?.toString() &&
                new Date(comp.completedDate || 0) >
                new Date((exp as any).createdAt || 0)
            );

            if (!hasNewerCompletion) {
                trueExpiredCount++;
            }
        }

        // Corrected Formula: Based on Completed History
        const expiredPercentage =
            completedRecords.length > 0
                ? (trueExpiredCount / completedRecords.length) * 100
                : 0;

        // Failure Rate
        const usersWhoFailed = new Set(
            failedRecords.map(r => (r.user as any)?._id?.toString())
        );

        const attemptingRecords = allRecords.filter(
            r =>
                r.status === 'COMPLETED' ||
                r.status === 'FAILED' ||
                (r.assessmentAttempts && r.assessmentAttempts > 0)
        );

        const usersWhoAttempted = new Set(
            attemptingRecords.map(r => (r.user as any)?._id?.toString())
        );

        const failureRate =
            usersWhoAttempted.size > 0
                ? (usersWhoFailed.size / usersWhoAttempted.size) * 100
                : 0;

        // Average Attempts
        let totalAttemptsForPassed = 0;
        completedRecords.forEach(r => {
            totalAttemptsForPassed += r.assessmentAttempts || 1;
        });

        const avgAttempts =
            completedRecords.length > 0
                ? totalAttemptsForPassed / completedRecords.length
                : 0;

        // ================================
        // 4️⃣ RISK SCORING (DETERMINISTIC)
        // ================================
        const globalRiskScore =
            failureRate * 0.3 +
            overduePercentage * 0.4 +
            expiredPercentage * 0.3;

        // ================================
        // 5️⃣ DEPARTMENT BREAKDOWN
        // ================================
        const deptMap = new Map<string, any[]>();

        allRecords.forEach(r => {
            const user = r.user as any;
            // Handle missing department by grouping as 'Unassigned'
            const deptName = user?.department || 'Unassigned';

            if (!deptMap.has(deptName)) {
                deptMap.set(deptName, []);
            }
            deptMap.get(deptName)?.push(r);
        });

        const byDepartment: any[] = [];

        for (const [deptName, records] of deptMap.entries()) {
            const dAssigned = records.length;
            const dCompleted = records.filter(r => r.status === 'COMPLETED').length;
            const dOverdue = records.filter(r => r.status === 'OVERDUE').length;
            const dExpired = records.filter(r => r.status === 'EXPIRED').length;
            const dFailed = records.filter(r => r.status === 'FAILED');

            const dUsersFailed = new Set(
                dFailed.map(r => (r.user as any)?._id?.toString())
            );

            const dAttempting = records.filter(
                r =>
                    r.status === 'COMPLETED' ||
                    r.status === 'FAILED' ||
                    (r.assessmentAttempts && r.assessmentAttempts > 0)
            );

            const dUsersAttempted = new Set(
                dAttempting.map(r => (r.user as any)?._id?.toString())
            );

            const dFailureRate =
                dUsersAttempted.size > 0
                    ? (dUsersFailed.size / dUsersAttempted.size) * 100
                    : 0;

            const dCompliancePct =
                dAssigned > 0 ? (dCompleted / dAssigned) * 100 : 0;

            const dOverduePct =
                dAssigned > 0 ? (dOverdue / dAssigned) * 100 : 0;

            const dExpiredPct =
                dAssigned > 0 ? (dExpired / dAssigned) * 100 : 0;

            const dRiskScore =
                dFailureRate * 0.3 +
                dOverduePct * 0.4 +
                dExpiredPct * 0.3;

            byDepartment.push({
                departmentName: deptName,
                compliancePercentage: parseFloat(dCompliancePct.toFixed(2)),
                riskScore: parseFloat(dRiskScore.toFixed(2))
            });
        }

        // ================================
        // 6️⃣ RISK HEATMAP (Training Level)
        // ================================
        const trainingMap = new Map<string, any>();

        allRecords.forEach(r => {
            const training = r.training as any;
            const master = r.trainingMaster as any;

            // Fallback to Master if Training is missing or title is missing
            const tid = training?._id?.toString() || master?._id?.toString();
            const title = training?.title || master?.title || 'Unknown Training';

            if (tid) {
                if (!trainingMap.has(tid)) {
                    trainingMap.set(tid, {
                        title: title,
                        records: []
                    });
                }
                trainingMap.get(tid).records.push(r);
            }
        });

        const riskHeatmap: any[] = [];

        for (const [tid, data] of trainingMap.entries()) {
            const tFailed = data.records.filter((r: any) => r.status === 'FAILED');

            const tAttempting = data.records.filter(
                (r: any) =>
                    r.status === 'COMPLETED' ||
                    r.status === 'FAILED' ||
                    (r.assessmentAttempts && r.assessmentAttempts > 0)
            );

            const usersFailed = new Set(
                tFailed.map((r: any) => r.user?._id?.toString())
            );

            const usersAttempted = new Set(
                tAttempting.map((r: any) => r.user?._id?.toString())
            );

            const tFailureRate =
                usersAttempted.size > 0
                    ? (usersFailed.size / usersAttempted.size) * 100
                    : 0;

            let riskLevel = 'LOW';
            if (tFailureRate > 50) riskLevel = 'HIGH';
            else if (tFailureRate > 20) riskLevel = 'MEDIUM';

            riskHeatmap.push({
                trainingId: tid,
                title: data.title,
                riskLevel,
                failureRate: parseFloat(tFailureRate.toFixed(2))
            });
        }

        // ================================
        // 7️⃣ RESPONSE
        // ================================
        return res.status(200).json({
            meta: {
                timestamp: new Date().toISOString(),
                scope: 'GLOBAL'
            },
            metrics: {
                compliancePercentage: parseFloat(compliancePercentage.toFixed(2)),
                overduePercentage: parseFloat(overduePercentage.toFixed(2)),
                expiredPercentage: parseFloat(expiredPercentage.toFixed(2)),
                failureRate: parseFloat(failureRate.toFixed(2)),
                avgAttempts: parseFloat(avgAttempts.toFixed(2)),
                globalRiskScore: parseFloat(globalRiskScore.toFixed(2))
            },
            breakdown: {
                byDepartment
            },
            riskHeatmap
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        return res.status(500).json({
            message: 'Error retrieving analytics data'
        });
    }
};

/**
 * @desc    Generate AI Insight for Compliance
 * @route   POST /api/analytics/ai-insight
 * @access  Private (Admin/QA)
 */
export const generateInsight = async (req: AuthRequest, res: Response) => {
    try {
        const { analyticsData, context } = req.body;

        if (!analyticsData) {
            return res.status(400).json({ message: 'Analytics data required' });
        }

        const insight = await analyzeComplianceData(
            req.user?._id?.toString() || 'SYSTEM',
            analyticsData,
            context || 'General Overview',
            req
        );

        return res.status(200).json({ insight });

    } catch (error) {
        console.error('AI Insight Error:', error);
        return res.status(500).json({ message: 'Failed to generate insight' });
    }
};
