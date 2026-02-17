
import { generateQuestionsAI, evaluateAnswersAI } from './services/aiService';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runTest = async () => {
    console.log("Starting AI Service Test...");

    // 1. Mock Document Text
    const sampleText = `
    Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct.
    The process takes place in the chloroplasts of plant cells. It is essential for life on Earth as it provides energy for the food chain and releases oxygen into the atmosphere.
    The overall chemical equation is: 6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2.
    `;

    console.log("\n--- Step 1: Generating Questions ---");
    console.log("Input Text Length:", sampleText.length);

    try {
        const questions = await generateQuestionsAI(sampleText);
        console.log("Generated Questions:", JSON.stringify(questions, null, 2));

        // 2. Mock User Answers (Some correct, some wrong)
        const mockAnswers: { [key: string]: string } = {};

        if (questions.mcq && questions.mcq.length > 0) {
            // Answer 1: Wrong
            mockAnswers["q0"] = questions.mcq[0].options[0] === questions.mcq[0].answer
                ? questions.mcq[0].options[1]
                : questions.mcq[0].options[0];

            // Answer 2: Correct
            mockAnswers["q1"] = questions.mcq[1].answer;
        }

        console.log("\n--- Step 2: Evaluating Answers ---");
        const evaluation = await evaluateAnswersAI(sampleText, questions, mockAnswers);
        console.log("Evaluation Result:", JSON.stringify(evaluation, null, 2));

    } catch (error) {
        console.error("Test Failed:", error);
    }
};

runTest();
