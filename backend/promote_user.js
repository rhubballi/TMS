
const mongoose = require('mongoose');
const uri = "mongodb://localhost:27017/tms_db";

async function promote() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const email = 'vaibhavrh21@gmail.com';
        const result = await mongoose.connection.db.collection('users').updateOne(
            { email: email },
            { $set: { role: 'Administrator' } }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully promoted ${email} to Administrator`);
            const updatedUser = await mongoose.connection.db.collection('users').findOne({ email: email });
            console.log('Updated user role:', updatedUser.role);
        } else {
            console.log(`User ${email} not found`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

promote();
