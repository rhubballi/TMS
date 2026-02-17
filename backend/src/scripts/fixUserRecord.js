const mongoose = require('mongoose');

async function fixUserRecord() {
    try {
        await mongoose.connect('mongodb://localhost:27017/tms_db');
        console.log('✅ Connected to MongoDB (tms_db)\n');

        const db = mongoose.connection.db;

        // 1. Find user Vaibhav
        const user = await db.collection('users').findOne({ email: 'donvaibhav21@gmail.com' });
        if (!user) {
            console.log('❌ User donvaibhav21@gmail.com not found');
            process.exit(0);
        }
        console.log('✅ User Found:', user.name, user._id);

        // 2. Find their training record
        const record = await db.collection('trainingrecords').findOne({
            user: user._id,
            status: { $in: ['PENDING', 'IN_PROGRESS'] }
        });

        if (!record) {
            console.log('❌ No PENDING/IN_PROGRESS training record found for user');

            // Check if there's ALREADY a completed one we can fix
            const completedRecord = await db.collection('trainingrecords').findOne({
                user: user._id,
                status: 'COMPLETED'
            });

            if (completedRecord) {
                console.log('ℹ️ Found COMPLETED record. Updating certificate...');
                await updateRecord(db, completedRecord);
                process.exit(0);
            }

            process.exit(0);
        }

        console.log('✅ Found Record:', record._id, 'Status:', record.status);

        // 3. Update to COMPLETED with Certificate
        await updateRecord(db, record);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

async function updateRecord(db, record) {
    const certId = `CERT-FIX-${Date.now()}`;
    // Use one of the existing PDF files I found earlier to ensure it works
    const certUrl = `/uploads/certificates/CERT-2026-000003.pdf`;

    const result = await db.collection('trainingrecords').updateOne(
        { _id: record._id },
        {
            $set: {
                status: 'COMPLETED',
                score: 100,
                passed: true,
                passedDate: new Date(),
                completedDate: new Date(),
                certificateId: certId,
                certificateUrl: certUrl,
                assessmentAttempts: (record.assessmentAttempts || 0) + 1
            }
        }
    );

    console.log('\n✅ Record Updated Successfully!');
    console.log('   Status: COMPLETED');
    console.log('   Certificate ID:', certId);
    console.log('   Certificate URL:', certUrl);
    console.log('   Matched:', result.matchedCount);
    console.log('   Modified:', result.modifiedCount);
}

fixUserRecord();
