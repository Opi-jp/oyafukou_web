const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrateLineManagers() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('=== LINE Manager Migration ===\n');
    
    // 1. oyafukou_db からマネージャー情報を取得
    const oyafukouDb = client.db('oyafukou_db');
    const managers = await oyafukouDb.collection('managers').find({}).toArray();
    console.log(`Found ${managers.length} managers to migrate`);
    
    if (managers.length === 0) {
      console.log('No managers to migrate');
      return;
    }
    
    // 2. parent_site_admin の stores コレクションを更新
    const parentDb = client.db('parent_site_admin');
    
    for (const manager of managers) {
      console.log(`\nMigrating: ${manager.managerName} (${manager.lineUserId})`);
      
      try {
        // 店舗を更新
        const result = await parentDb.collection('stores').updateOne(
          { _id: new ObjectId(manager.storeId) },
          { 
            $set: { 
              lineUserId: manager.lineUserId,
              lineManagerActive: manager.isActive,
              managerName: manager.managerName,
              lastUpdated: new Date()
            } 
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`✓ Successfully migrated to store ID: ${manager.storeId}`);
        } else {
          console.log(`⚠️  Store not found or already has LINE info: ${manager.storeId}`);
        }
      } catch (error) {
        console.error(`✗ Error migrating manager ${manager.managerName}:`, error.message);
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log('LINE manager data has been migrated to stores collection');
    console.log('You can now safely remove the oyafukou_db.managers collection');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.close();
  }
}

migrateLineManagers();