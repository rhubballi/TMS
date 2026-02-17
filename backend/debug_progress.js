
const axios = require('axios');

async function checkProgress() {
    try {
        // 1. Login as trainee
        const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'ratnamaa104@gmail.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in, token obtained.');

        // 2. Get My Training Records to find an ID
        const recordsRes = await axios.get('http://localhost:4000/api/training-records/my', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (recordsRes.data.length === 0) {
            console.log('No records found.');
            return;
        }

        const recordId = recordsRes.data[0]._id;
        console.log('Checking progress for record:', recordId);

        // 3. Get Learning Progress
        const progressRes = await axios.get(`http://localhost:4000/api/learning-progress/${recordId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Progress Data Content Items:', JSON.stringify(progressRes.data.contentItems, null, 2));

        if (!progressRes.data.contentItems[0].fileUrl) {
            console.error('FAIL: fileUrl is MISSING!');
        } else {
            console.log('SUCCESS: fileUrl is present:', progressRes.data.contentItems[0].fileUrl);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

checkProgress();
