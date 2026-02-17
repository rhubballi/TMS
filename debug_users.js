const mongoose = require('mongoose');

async function checkUsers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/tms_db');
        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            role: String,
            department: String
        }));

        const users = await User.find({});
        console.log('--- USER SUMMARY ---');
        const summary = {};
        users.forEach(u => {
            const role_dept = `${u.role || 'NoRole'} | ${u.department || 'NoDept'}`;
            summary[role_dept] = (summary[role_dept] || 0) + 1;
        });
        console.log(summary);
        console.log('Total Users:', users.length);
        console.log('------------------');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
