const mongoose = require('mongoose');

async function repair() {
    try {
        await mongoose.connect('mongodb://localhost:27017/tms_db');
        console.log('Connected to tms_db');

        const UserCollection = mongoose.connection.db.collection('users');

        // 1. List all users for visual inspection in logs
        const allUsers = await UserCollection.find({}).toArray();
        console.log('--- ALL USERS ---');
        allUsers.forEach(u => console.log(`${u.email} : ${u.role}`));

        // 2. Identify and Normalize
        const result = await UserCollection.updateMany(
            { role: { $in: ['admin', 'Admin', 'ADMIN', 'administrator'] } },
            { $set: { role: 'Administrator' } }
        );
        console.log(`Normalized roles for ${result.modifiedCount} users.`);

        // 3. Search for the hubballi user (loose match)
        const hubballiUser = await UserCollection.findOne({ email: /hubballi/i });
        if (hubballiUser) {
            console.log(`Found hubballi user: ${hubballiUser.email} (Current Role: ${hubballiUser.role})`);
            await UserCollection.updateOne({ _id: hubballiUser._id }, { $set: { role: 'Administrator' } });
            console.log(`Set ${hubballiUser.email} to Administrator.`);
        } else {
            console.log('No user found matching /hubballi/i');
        }

        process.exit(0);
    } catch (err) {
        console.error('Repair failed:', err);
        process.exit(1);
    }
}

repair();
