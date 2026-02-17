import { logAuditEvent } from './auditService';
import { AuditEventType } from '../models/TrainingAuditLog';

/**
 * AI Analytics Service - Governance Layer
 * STRICT READ-ONLY. No write permissions.
 */

export const analyzeComplianceData = async (
    userId: string,
    analyticsData: any,
    queryContext: string,
    req?: any
): Promise<string> => {

    // 1. Log the AI Query (Audit Trail)
    // We assume access to 'req' or pass needed info
    const meta = {
        purpose: "AI Analytics Insight",
        model: "PLACEHOLDER_M8", // As per meta
        inputLength: JSON.stringify(analyticsData).length,
        timestamp: new Date().toISOString()
    };

    // Log using valid event type from Sprint 3
    if (userId) {
        // Since BAI_ANALYTICS_QUERY is now in TrainingAuditLog, we can use it.
        const eventData = {
            event_type: AuditEventType.BAI_ANALYTICS_QUERY,
            user_id: userId,
            event_source: 'SYSTEM', // or USER depending on context, assuming System for now or passed from req
            metadata: meta,
            req: req
        };
        // Note: auditService logAuditEvent signature requires specific fields, let's match it roughly
        // Actually logAuditEvent takes an object. 
        // We need to cast or ignore strict type checking if AuditEventType enum isn't fully updated in all places yet
        // But we updated the model file.

        await logAuditEvent({
            event_type: AuditEventType.BAI_ANALYTICS_QUERY,
            user_id: userId,
            event_source: 'USER' as any, // Cast to avoid enum import issues if any
            metadata: meta,
            req: req
        });
    }

    // 2. Perform Analysis (Mocked)
    const summary = generateMockInsight(analyticsData, queryContext);

    return `AI Generated – For Review Only: ${summary}`;
};

function generateMockInsight(data: any, query: string): string {
    const compliance = data.metrics?.compliancePercentage || 0;
    const risk = data.metrics?.globalRiskScore || 0;

    return `Compliance is at ${compliance}%. Global Risk Score is ${risk}. Assessment indicates ${risk > 20 ? 'moderate' : 'low'} systemic risk. Recommendation: Review overdue items in IT department.`;
}
