
const axios = require('axios');

async function testAcknowledge() {
    try {
        // 1. Login
        const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'ratnamaa104@gmail.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in.');

        // 2. Get Records
        const recordsRes = await axios.get('http://localhost:4000/api/training-records/my', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (recordsRes.data.length === 0) {
            console.log('No records found.');
            return;
        }

        const recordId = recordsRes.data[0]._id;
        console.log('Testing Record:', recordId);

        // 3. Call Acknowledge
        try {
            await axios.put(`http://localhost:4000/api/training-records/${recordId}/acknowledge`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Acknowledge call successful.');
        } catch (e) {
            console.log('Acknowledge call failed (maybe already acknowledged):', e.response ? e.response.data : e.message);
        }

        // 4. Verify Status
        const verifyRes = await axios.get(`http://localhost:4000/api/learning-progress/${recordId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const record = verifyRes.data.trainingRecord;
        console.log('Document Acknowledged:', record.documentAcknowledged);

        if (record.documentAcknowledged) {
            console.log('PASS: Document is acknowledged.');
        } else {
            console.error('FAIL: Document NOT acknowledged.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAcknowledge();
