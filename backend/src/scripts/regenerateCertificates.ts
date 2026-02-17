import mongoose from 'mongoose';
import TrainingRecord from '../models/TrainingRecord';
import { generateCertificateId, generateCertificatePDF } from '../services/certificateService';

/**
 * One-time script to regenerate certificates for COMPLETED training records
 * that don't have certificates (completed before Sprint 3)
 */
async function regenerateCertificates() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all COMPLETED records without certificates
        const recordsWithoutCerts = await TrainingRecord.find({
            status: 'COMPLETED',
            $or: [
                { certificateId: { $exists: false } },
                { certificateId: null },
                { certificateUrl: { $exists: false } },
                { certificateUrl: null }
            ]
        })
            .populate('user')
            .populate({ path: 'training', populate: { path: 'trainingMaster' } });

        console.log(`\n📋 Found ${recordsWithoutCerts.length} COMPLETED records without certificates\n`);

        if (recordsWithoutCerts.length === 0) {
            console.log('✅ All COMPLETED records already have certificates!');
            process.exit(0);
        }

        let successCount = 0;
        let errorCount = 0;

        // Process each record
        for (const record of recordsWithoutCerts) {
            try {
                if (!record.user || !record.training) {
                    console.log(`⚠️  Skipping record ${record._id}: Missing user or training data`);
                    errorCount++;
                    continue;
                }

                const userObj = record.user as any;
                const trainingObj = record.training as any;
                const masterObj = trainingObj.trainingMaster;

                console.log(`🔄 Generating certificate for: ${userObj.name} - ${trainingObj.title || 'Unknown Training'}`);

                // 1. Generate Certificate ID
                const certId = generateCertificateId(userObj, trainingObj);
                record.certificateId = certId;

                // 2. Generate PDF
                const pdfPath = await generateCertificatePDF(record, userObj, trainingObj, masterObj);
                record.certificateUrl = pdfPath;

                // 3. Calculate expiry date if not set
                if (!record.expiryDate && masterObj && masterObj.validity_period && masterObj.validity_period > 0) {
                    const validityDays = masterObj.validity_unit === 'years' ? masterObj.validity_period * 365 :
                        masterObj.validity_unit === 'months' ? masterObj.validity_period * 30 :
                            masterObj.validity_period;

                    const expiryDate = new Date(record.completedDate || new Date());
                    expiryDate.setDate(expiryDate.getDate() + validityDays);
                    record.expiryDate = expiryDate;
                }

                // 4. Save the record
                await record.save();

                console.log(`   ✅ Generated: ${certId} at ${pdfPath}`);
                successCount++;

            } catch (error) {
                console.error(`   ❌ Error generating certificate for record ${record._id}:`, error);
                errorCount++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📝 Total: ${recordsWithoutCerts.length}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
regenerateCertificates();
