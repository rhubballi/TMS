import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import pdf from 'pdf-parse';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Interface for Generated Questions - SPRINT 1/2: MCQ ONLY
export interface GeneratedQuestions {
    mcq: { question: string; options: string[]; answer: string }[];
}

export const analyzeDocument = async (filePath: string, fileType: string): Promise<string> => {
    try {
        let text = '';
        if (fileType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            text = data.text;
        } else if (fileType === 'text/plain') {
            text = fs.readFileSync(filePath, 'utf-8');
        } else {
            throw new Error('Unsupported file type');
        }
        return text;
    } catch (error) {
        console.error("Error parsing document:", error);
        throw error;
    }
};

export const generateQuestionsAI = async (text: string): Promise<GeneratedQuestions> => {
    const truncatedText = text.slice(0, 25000);

    const prompt = `
    Analyze the following document content and generate a training assessment.
    
    Document Content:
    "${truncatedText}"

    Requirements:
    1. Generate 10 Multiple Choice Questions (MCQs) with 4 options and 1 correct answer.
    
    Output strictly in Valid JSON format with this structure:
    {
        "mcq": [{"question": "Q1", "options": ["A", "B", "C", "D"], "answer": "Correct Option Text"}...]
    }
    Include no other text.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 4096
        });

        const responseText = chatCompletion.choices[0]?.message?.content || '';

        // Sprint 3: AI Governance - Log AI usage
        // Note: userId will be passed from controller in future enhancement
        // For now, we log the AI usage without user context
        try {
            const { logAIUsed } = await import('./auditService');
            await logAIUsed(
                'SYSTEM', // Placeholder - should be passed from controller
                'QUESTION_GENERATION',
                {
                    inputLength: truncatedText.length,
                    outputLength: responseText.length,
                    model: 'llama-3.3-70b-versatile',
                    tokensUsed: chatCompletion.usage?.total_tokens || 0
                }
            );
        } catch (auditError) {
            console.error('[AI] Failed to log AI usage:', auditError);
            // Non-blocking: continue even if audit logging fails
        }

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Validate structure
        if (!parsed.mcq || !Array.isArray(parsed.mcq)) {
            throw new Error('Invalid question structure from AI');
        }

        // Ensure exactly 10 MCQs
        const mcq = parsed.mcq.slice(0, 10);

        return { mcq };

    } catch (error) {
        console.error('Error generating questions with AI:', error);
        throw new Error('Failed to generate questions using AI');
    }
};

export interface EvaluationResult {
    score: number;
    percentage: number;
    results: {
        question: string;
        userAnswer: string;
        correct: boolean;
        correctAnswer: string;
    }[];
}

export const evaluateAnswersAI = async (
    documentText: string,
    questions: any,
    userAnswers: any
): Promise<EvaluationResult> => {
    const truncatedText = documentText.slice(0, 20000);

    const prompt = `
    You are a technical assessment evaluator for a Training Management System (TMS).
    Your job is to check user answers against the correct answers based ON THE PROVIDED DOCUMENT.

    Document Content:
    "${truncatedText}"

    Questions and User Answers:
    ${JSON.stringify({ questions, userAnswers }, null, 2)}

    WHAT YOU MUST DO
    1. Compare every user answer with the correct answer from the document.
    2. Decide if each answer is Correct (true) or Wrong (false).
    3. Calculate total correct and final percentage.

    Output strictly in JSON format:
    {
        "score": number, // Total correct answers
        "percentage": number,
        "results": [
            {
                "question": "question text",
                "userAnswer": "user answer text",
                "correct": boolean,
                "correctAnswer": "The exact correct answer"
            }
        ]
    }
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0]?.message?.content || '{}';

        try {
            return JSON.parse(content);
        } catch (parseError) {
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]);
            }
            throw new Error(`Failed to parse AI response: ${(parseError as Error).message}`);
        }
    } catch (error) {
        console.error("Error evaluating answers:", error);
        throw error;
    }
};
