
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/tms_db';
const API_URL = 'http://localhost:4000/api';

async function runTest() {
    try {
        console.log('--- 1. Database Setup ---');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        const email = 'audit_test@gmail.com';
        const password = 'password123';

        // Clean up old test user
        await mongoose.connection.db.collection('users').deleteOne({ email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await mongoose.connection.db.collection('users').insertOne({
            name: 'Audit Tester',
            email,
            password: hashedPassword,
            role: 'Administrator',
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`Created test admin: ${email}`);

        console.log('\n--- 2. Login ---');
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
            const token = loginRes.data.token;
            console.log('Login successful, token acquired.');

            console.log('\n--- 3. Fetch Audit Logs ---');
            const auditRes = await axios.get(`${API_URL}/audit-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Response Status:', auditRes.status);
            console.log('Total Logs reported by API:', auditRes.data.total);
            console.log('Logs array length:', auditRes.data.logs.length);

            if (auditRes.data.logs.length > 0) {
                console.log('First log entry:', JSON.stringify(auditRes.data.logs[0], null, 2));
            } else {
                console.log('WARNING: API returned 0 logs.');
            }
        } catch (apiErr) {
            console.error('API Error:', apiErr.response ? apiErr.response.data : apiErr.message);
        }

        console.log('\n--- 4. Direct DB Check ---');
        const count = await mongoose.connection.db.collection('trainingauditlogs').countDocuments({});
        console.log('Direct DB count of trainingauditlogs:', count);

        const sample = await mongoose.connection.db.collection('trainingauditlogs').find({}).limit(1).toArray();
        console.log('Raw sample log from DB:', JSON.stringify(sample[0], null, 2));

        // Cleanup
        await mongoose.connection.db.collection('users').deleteOne({ email });
        console.log('\nTest admin cleaned up.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('\nSCRIPT ERROR:', err.message);
        process.exit(1);
    }
}

runTest();
