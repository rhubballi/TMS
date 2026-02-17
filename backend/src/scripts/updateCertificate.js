/**
 * Simple script to manually update a COMPLETED record with certificate data
 * Run this to test certificate display in the UI
 */

const mongoose = require('mongoose');

async function updateCertificateManually() {
    try {
        await mongoose.connect('mongodb://localhost:27017/tms');
        console.log('✅ Connected to MongoDB\n');

        const TrainingRecord = mongoose.connection.collection('trainingrecords');

        // Find a COMPLETED record without certificate
        const record = await TrainingRecord.findOne({
            status: 'COMPLETED',
            $or: [
                { certificateId: { $exists: false } },
                { certificateId: null }
            ]
        });

        if (!record) {
            console.log('❌ No COMPLETED records found without certificates');

            // Show all records
            const allRecords = await TrainingRecord.find({}).limit(5).toArray();
            console.log('\n📋 First 5 records in database:');
            allRecords.forEach((r, i) => {
                console.log(`${i + 1}. Status: ${r.status}, CertID: ${r.certificateId || 'NULL'}`);
            });

            process.exit(0);
        }

        console.log('📋 Found COMPLETED record:', record._id);
        console.log('   Current certificateId:', record.certificateId || 'NULL');
        console.log('   Current certificateUrl:', record.certificateUrl || 'NULL');

        // Generate certificate ID and URL
        const certId = `CERT-2026-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
        const certUrl = `/uploads/certificates/${certId}.pdf`;

        console.log('\n🔄 Updating record with:');
        console.log('   certificateId:', certId);
        console.log('   certificateUrl:', certUrl);

        // Update the record
        const result = await TrainingRecord.updateOne(
            { _id: record._id },
            {
                $set: {
                    certificateId: certId,
                    certificateUrl: certUrl
                }
            }
        );

        console.log('\n✅ Update result:', result);
        console.log('   Modified count:', result.modifiedCount);

        // Verify the update
        const updated = await TrainingRecord.findOne({ _id: record._id });
        console.log('\n📋 Verified updated record:');
        console.log('   certificateId:', updated.certificateId);
        console.log('   certificateUrl:', updated.certificateUrl);

        console.log('\n✅ Done! Refresh your browser to see the certificate link.');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateCertificateManually();
