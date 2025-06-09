const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkManagers() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // 両方のデータベースをチェック
    const databases = ['parent_site_admin', 'oyafukou_db'];
    
    for (const dbName of databases) {
      console.log(`\n=== Database: ${dbName} ===`);
      const db = client.db(dbName);
      
      // マネージャーを確認
      const managers = await db.collection('managers').find({}).toArray();
      console.log(`Managers count: ${managers.length}`);
      
      managers.forEach(manager => {
        console.log(`- ${manager.managerName} (${manager.lineUserId}) - Active: ${manager.isActive}`);
      });
      
      // 店舗数も確認
      const storesCount = await db.collection('stores').countDocuments();
      console.log(`Stores count: ${storesCount}`);
    }
    
    // 特定のユーザーIDを検索
    const targetUserId = 'U1c21601eb90ba8d35309982f3a172d3a';
    console.log(`\n=== Searching for user: ${targetUserId} ===`);
    
    for (const dbName of databases) {
      const db = client.db(dbName);
      const manager = await db.collection('managers').findOne({ lineUserId: targetUserId });
      if (manager) {
        console.log(`Found in ${dbName}:`, manager);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkManagers();