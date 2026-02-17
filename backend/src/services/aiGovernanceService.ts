import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { logAuditEvent } from './auditService';
import { AuditEventType, EventSource } from '../models/TrainingAuditLog';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export interface AIGovernanceResponse {
    insightSummary: string;
    riskExplanation: string;
    keyDrivers: string[];
    suggestedActions: string[];
}

/**
 * AI Governance Service
 * STRICTLY READ-ONLY analytical interpreter for compliance data.
 */
export const askAIGovernance = async (
    adminId: string,
    query: string,
    analyticsData: any,
    req?: any
): Promise<AIGovernanceResponse> => {

    // 1. Data Masking (Minimal PII exposure)
    // Assuming analyticsData is already aggregated or summarized
    const sanitizedData = JSON.stringify(analyticsData, (key, value) => {
        if (['name', 'email', 'phone', 'address'].includes(key.toLowerCase())) return '***';
        return value;
    });

    const systemPrompt = `
    You are the "TMS Governance Advisor", a specialized AI for Training Management Systems.
    Your role is to analyze compliance data and provide high-level governance insights.

    STRICT OPERATIVE RULES:
    1. You are READ-ONLY. Never suggest or perform data modifications.
    2. Focus on Risk identification, Compliance gaps, and Strategic advice.
    3. Your tone must be Professional, Objective, and Regulatory-aware.
    4. Suggested actions must be ADVISORY ONLY (e.g., "Consider reviewing HR policies" not "Update HR policies").
    5. Always include the disclaimer: "AI Generated – For Governance Review Only".

    CONTEXT DATA:
    ${sanitizedData}

    USER QUERY:
    "${query}"

    OUTPUT FORMAT (JSON):
    {
        "insightSummary": "General overview of the situation",
        "riskExplanation": "Detailed reasoning for identified risks",
        "keyDrivers": ["List of main factors causing current status"],
        "suggestedActions": ["Strategic suggestions for management review"]
    }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content || '{}';
        const response: AIGovernanceResponse = JSON.parse(content);

        // 2. Mandatory Audit Logging (Requirement)
        await logAuditEvent({
            event_type: AuditEventType.BAI_ANALYTICS_QUERY,
            user_id: adminId as any,
            event_source: EventSource.ADMIN,
            metadata: {
                query,
                model: 'llama-3.3-70b-versatile',
                token_usage: completion.usage?.total_tokens || 0,
                timestamp: new Date()
            },
            ip_address: req?.ip
        });

        return response;

    } catch (error) {
        console.error('[AI Governance Service] Error:', error);
        throw new Error('Failed to process AI governance query.');
    }
};
