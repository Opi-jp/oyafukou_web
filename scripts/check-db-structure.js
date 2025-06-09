const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseStructure() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('=== Database Structure ===\n');
    
    // 1. parent_site_admin
    console.log('📁 Database: parent_site_admin');
    const parentDb = client.db('parent_site_admin');
    
    // 店舗
    const storesCount = await parentDb.collection('stores').countDocuments();
    console.log(`  └─ stores: ${storesCount} documents`);
    
    // ユーザー
    const usersCount = await parentDb.collection('users').countDocuments();
    console.log(`  └─ users: ${usersCount} documents`);
    const users = await parentDb.collection('users').find({}).toArray();
    users.forEach(user => {
      console.log(`     └─ ${user.username} (${user.role})`);
    });
    
    // 2. oyafukou_db
    console.log('\n📁 Database: oyafukou_db');
    const oyafukouDb = client.db('oyafukou_db');
    
    // マネージャー
    const managersCount = await oyafukouDb.collection('managers').countDocuments();
    console.log(`  └─ managers: ${managersCount} documents`);
    const managers = await oyafukouDb.collection('managers').find({}).toArray();
    managers.forEach(manager => {
      console.log(`     └─ ${manager.managerName} - LINE ID: ${manager.lineUserId} - Store: ${manager.storeId}`);
    });
    
    console.log('\n=== Summary ===');
    console.log('parent_site_admin: 店舗データとユーザー認証');
    console.log('oyafukou_db: LINE連携マネージャー情報');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabaseStructure();