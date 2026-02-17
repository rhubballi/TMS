
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Adjust path to .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tms-db';
console.log('Connecting to:', MONGO_URI);

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    department: String,
    role: String
});

const trainingRecordSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training' },
    status: String,
    dueDate: Date,
    completedDate: Date
});

const User = mongoose.model('User', userSchema);
const TrainingRecord = mongoose.model('TrainingRecord', trainingRecordSchema);

async function checkData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const userCount = await User.countDocuments();
        const recordsCount = await TrainingRecord.countDocuments();

        console.log(`\n--- COUNTS ---`);
        console.log(`Users: ${userCount}`);
        console.log(`TrainingRecords: ${recordsCount}`);

        if (userCount > 0) {
            const usersWithDept = await User.countDocuments({ department: { $exists: true, $ne: null } });
            console.log(`Users with Department: ${usersWithDept}`);

            const sampleUser = await User.findOne({ department: { $exists: true } });
            console.log('Sample User with Dept:', sampleUser ? `${sampleUser.name} (${sampleUser.department})` : 'None');
        }

        if (recordsCount > 0) {
            const records = await TrainingRecord.find().populate('user').limit(5);
            console.log(`\n--- SAMPLE RECORDS (First 5) ---`);
            records.forEach(r => {
                const u = r.user as any;
                console.log(`Record: Status=${r.status}, User=${u ? u.name : 'NULL'} (Dept: ${u ? u.department : 'N/A'})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkData();
