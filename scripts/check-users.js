const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // 両方のデータベースでユーザーをチェック
    const databases = ['parent_site_admin', 'oyafukou_db'];
    
    for (const dbName of databases) {
      console.log(`\n=== Database: ${dbName} ===`);
      const db = client.db(dbName);
      
      // usersコレクションを確認
      const users = await db.collection('users').find({}).toArray();
      console.log(`Users count: ${users.length}`);
      
      users.forEach(user => {
        console.log(`- Username: ${user.username}, Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();