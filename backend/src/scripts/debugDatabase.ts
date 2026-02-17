import mongoose from 'mongoose';

/**
 * Debug script to check actual database state
 */
async function debugDatabase() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tms';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        // Get all training records
        const allRecords = await db.collection('trainingrecords').find({}).toArray();
        console.log(`📊 Total Training Records: ${allRecords.length}\n`);

        // Group by status
        const statusCounts: any = {};
        allRecords.forEach(r => {
            statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
        });

        console.log('📈 Records by Status:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

        // Check COMPLETED records specifically
        const completedRecords = allRecords.filter(r => r.status === 'COMPLETED');
        console.log(`\n✅ COMPLETED Records: ${completedRecords.length}`);

        if (completedRecords.length > 0) {
            console.log('\n📋 COMPLETED Record Details:');
            completedRecords.forEach((r, i) => {
                console.log(`\n${i + 1}. Record ID: ${r._id}`);
                console.log(`   User: ${r.user}`);
                console.log(`   Training: ${r.training}`);
                console.log(`   Status: ${r.status}`);
                console.log(`   Score: ${r.score || 'N/A'}`);
                console.log(`   Passed: ${r.passed}`);
                console.log(`   Certificate ID: ${r.certificateId || 'NULL'}`);
                console.log(`   Certificate URL: ${r.certificateUrl || 'NULL'}`);
                console.log(`   Expiry Date: ${r.expiryDate || 'NULL'}`);
                console.log(`   Completed Date: ${r.completedDate || 'NULL'}`);
            });
        }

        // Check for records with other statuses
        console.log('\n📋 All Records Summary:');
        allRecords.slice(0, 10).forEach((r, i) => {
            console.log(`${i + 1}. Status: ${r.status}, CertID: ${r.certificateId || 'NULL'}, CertURL: ${r.certificateUrl || 'NULL'}`);
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugDatabase();
