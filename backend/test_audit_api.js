
const axios = require('axios');

async function testAuditLogs() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'vaibhavrh21@gmail.com',
            password: 'password123' // I'll assume this is the password or I need to find it
        });

        const token = loginRes.data.token;
        console.log('Token acquired.');

        // 2. Fetch Audit Logs
        console.log('Fetching audit logs...');
        const auditRes = await axios.get('http://localhost:4000/api/audit-logs', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Response Status:', auditRes.status);
        console.log('Total Logs:', auditRes.data.total);
        console.log('Logs Count:', auditRes.data.logs.length);
        if (auditRes.data.logs.length > 0) {
            console.log('First Log Type:', auditRes.data.logs[0].event_type);
        }
    } catch (err) {
        console.error('Test failed:', err.response ? err.response.data : err.message);
    }
}

testAuditLogs();
