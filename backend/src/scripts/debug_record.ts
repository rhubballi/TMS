
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TrainingRecord from '../models/TrainingRecord';
import Training from '../models/Training';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const checkRecord = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected.');

        const recordId = '6981c0d9d901e180317f01eb'; // ID from user error
        console.log(`Checking Record ID: ${recordId}`);

        const record = await TrainingRecord.findById(recordId);
        if (!record) {
            console.log('Record NOT FOUND');
            return;
        }
        console.log('Record found:', record.toObject());

        const training = await Training.findById(record.training);
        if (!training) {
            console.log('Use Training NOT FOUND for ID:', record.training);
            return;
        }

        console.log('Training found.');
        console.log('Training ID:', training._id);
        console.log('Has Content Field?', !!training.content);
        if (training.content) {
            console.log('Content Keys:', Object.keys(training.content));
            console.log('FileName:', training.content.fileName);
            console.log('Questions Present?', !!training.content.questions);
            if (training.content.questions) {
                console.log('Question Counts:', {
                    short: training.content.questions.shortAnswer?.length,
                    mcq: training.content.questions.mcq?.length,
                    tf: training.content.questions.trueFalse?.length
                });
            }
        } else {
            console.log('FULL TRAINING OBJ:', JSON.stringify(training.toObject(), null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkRecord();
