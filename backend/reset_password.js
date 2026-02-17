const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = "mongodb://localhost:27017/tms_db";

async function resetPassword() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const email = process.argv[2] || 'admin@gmail.com';
        const password = process.argv[3] || 'admin';

        console.log(`Resetting password for ${email}...`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await mongoose.connection.db.collection('users').updateOne(
            { email: email },
            { $set: { password: hashedPassword, isVerified: true } }
        );

        if (result.matchedCount > 0) {
            console.log(`Password reset successful for ${email}`);
        } else {
            console.log(`User ${email} not found`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

resetPassword();
