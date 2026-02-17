/**
 * Sync existing certificate data from TrainingRecord to the new trainingcertificates collection
 */

const mongoose = require('mongoose');
const path = require('path');

// Mock a way to get the TrainingRecord collection and sync data
async function backfillCertificates() {
    try {
        await mongoose.connect('mongodb://localhost:27017/tms');
        console.log('✅ Connected to MongoDB');

        const TrainingRecord = mongoose.connection.collection('trainingrecords');
        const TrainingCertificate = mongoose.connection.collection('trainingcertificates');

        // Find all records with certificates
        const recordsWithCerts = await TrainingRecord.find({
            certificateId: { $ne: null, $exists: true }
        }).toArray();

        console.log(`📋 Found ${recordsWithCerts.length} records with certificates to sync.`);

        let syncedCount = 0;
        for (const record of recordsWithCerts) {
            // Check if certificate already exists in dedicated collection
            const existing = await TrainingCertificate.findOne({ certificateId: record.certificateId });

            if (!existing) {
                await TrainingCertificate.insertOne({
                    certificateId: record.certificateId,
                    user: record.user,
                    training: record.training,
                    trainingRecord: record._id,
                    issueDate: record.completedDate || record.updatedAt || new Date(),
                    expiryDate: record.expiryDate,
                    score: record.score || 0,
                    resultGrade: record.resultGrade || (record.score > 60 ? 'EXCELLENT' : 'PASS'),
                    certificateUrl: record.certificateUrl,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                syncedCount++;
            }
        }

        console.log(`✅ Successfully synced ${syncedCount} certificates to trainingcertificates collection.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during backfill:', error);
        process.exit(1);
    }
}

backfillCertificates();
