const mongoose = require('mongoose');

const uri = "mongodb://localhost:27017/tms_db";

async function checkData() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(`Found ${users.length} users.`);
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, Verified: ${u.isVerified}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkData();
