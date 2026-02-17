/**
 * End-to-end test: Create test data and submit assessment to verify certificate generation
 */

const mongoose = require('mongoose');
const axios = require('axios');

async function testCertificateGeneration() {
    try {
        await mongoose.connect('mongodb://localhost:27017/tms');
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Find or create a test user
        const User = mongoose.connection.collection('users');
        let testUser = await User.findOne({ email: 'test@example.com' });

        if (!testUser) {
            console.log('Creating test user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 10);

            const result = await User.insertOne({
                name: 'Test User',
                email: 'test@example.com',
                password: hashedPassword,
                role: 'employee',
                department: 'IT',
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            testUser = await User.findOne({ _id: result.insertedId });
        }

        console.log('✅ Test user:', testUser.email);

        // Step 2: Find or create a training
        const Training = mongoose.connection.collection('trainings');
        let training = await Training.findOne({});

        if (!training) {
            console.log('❌ No training found in database');
            console.log('Please create a training first through the admin panel');
            process.exit(1);
        }

        console.log('✅ Found training:', training.title || training._id);

        // Step 3: Find or create an assessment
        const Assessment = mongoose.connection.collection('assessments');
        let assessment = await Assessment.findOne({ training: training._id });

        if (!assessment) {
            console.log('Creating test assessment...');
            const assessmentResult = await Assessment.insertOne({
                training: training._id,
                pass_percentage: 70,
                max_attempts: 3,
                time_limit: 30,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            assessment = await Assessment.findOne({ _id: assessmentResult.insertedId });

            // Create test questions
            const AssessmentQuestion = mongoose.connection.collection('assessmentquestions');
            await AssessmentQuestion.insertMany([
                {
                    assessment: assessment._id,
                    question_text: 'Test Question 1?',
                    question_type: 'mcq',
                    options: ['A', 'B', 'C', 'D'],
                    correct_answer: 'A',
                    createdAt: new Date()
                },
                {
                    assessment: assessment._id,
                    question_text: 'Test Question 2?',
                    question_type: 'mcq',
                    options: ['A', 'B', 'C', 'D'],
                    correct_answer: 'B',
                    createdAt: new Date()
                }
            ]);
        }

        console.log('✅ Assessment configured');

        // Step 4: Create or update training record
        const TrainingRecord = mongoose.connection.collection('trainingrecords');
        let record = await TrainingRecord.findOne({
            user: testUser._id,
            training: training._id
        });

        if (!record) {
            console.log('Creating training record...');
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            const recordResult = await TrainingRecord.insertOne({
                user: testUser._id,
                training: training._id,
                status: 'PENDING',
                assignedDate: new Date(),
                dueDate: dueDate,
                documentViewed: true,
                documentAcknowledged: true,
                assessmentAttempts: 0,
                passed: false,
                assignmentSource: 'manual',
                completedLate: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            record = await TrainingRecord.findOne({ _id: recordResult.insertedId });
        } else {
            // Update to acknowledged state
            await TrainingRecord.updateOne(
                { _id: record._id },
                {
                    $set: {
                        documentViewed: true,
                        documentAcknowledged: true,
                        status: 'IN_PROGRESS'
                    }
                }
            );
        }

        console.log('✅ Training record ready');
        console.log('\n📋 Test Data Summary:');
        console.log('   User ID:', testUser._id);
        console.log('   Training ID:', training._id);
        console.log('   Record ID:', record._id);
        console.log('   Assessment ID:', assessment._id);

        // Step 5: Get questions
        const AssessmentQuestion = mongoose.connection.collection('assessmentquestions');
        const questions = await AssessmentQuestion.find({ assessment: assessment._id }).toArray();

        console.log('\n📝 Questions:', questions.length);

        // Step 6: Prepare answers (all correct)
        const answers = {};
        questions.forEach(q => {
            answers[q._id.toString()] = q.correct_answer;
        });

        console.log('\n🔄 Submitting assessment with all correct answers...');
        console.log('   This should trigger certificate generation');

        // Step 7: Login and get token
        console.log('\n🔐 Logging in as test user...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Got auth token');

        // Step 8: Submit assessment
        console.log('\n📤 Submitting assessment...');
        const submitResponse = await axios.post(
            'http://localhost:5000/api/assessments/submit',
            {
                trainingId: training._id.toString(),
                answers: answers
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        console.log('\n✅ Assessment submitted!');
        console.log('\n📊 Response:');
        console.log('   Status:', submitResponse.data.status);
        console.log('   Score:', submitResponse.data.score);
        console.log('   Passed:', submitResponse.data.passed);
        console.log('   Certificate ID:', submitResponse.data.certificateId || 'NULL');
        console.log('   Certificate URL:', submitResponse.data.certificateUrl || 'NULL');
        console.log('   Expiry Date:', submitResponse.data.expiryDate || 'NULL');

        // Step 9: Verify database
        console.log('\n🔍 Verifying database...');
        const updatedRecord = await TrainingRecord.findOne({ _id: record._id });
        console.log('   DB Status:', updatedRecord.status);
        console.log('   DB Certificate ID:', updatedRecord.certificateId || 'NULL');
        console.log('   DB Certificate URL:', updatedRecord.certificateUrl || 'NULL');
        console.log('   DB Expiry Date:', updatedRecord.expiryDate || 'NULL');

        if (updatedRecord.certificateId && updatedRecord.certificateUrl) {
            console.log('\n✅ SUCCESS! Certificate generated and saved to database!');
        } else {
            console.log('\n❌ FAILED! Certificate not saved to database');
            console.log('   Check backend logs for errors during certificate generation');
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testCertificateGeneration();
