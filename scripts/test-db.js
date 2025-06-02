const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/:[^:]*@/, ':****@'));
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connection successful!');
    
    // コレクション一覧を取得
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Collections found:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Storesコレクションのドキュメント数を確認
    const Store = mongoose.models.Store || mongoose.model('Store', new mongoose.Schema({}, { strict: false }));
    const count = await Store.countDocuments();
    console.log(`\n📊 Number of stores: ${count}`);
    
    // 最初の1件を取得して構造を確認
    if (count > 0) {
      const firstStore = await Store.findOne();
      console.log('\n🏪 Sample store structure:');
      console.log(JSON.stringify(firstStore, null, 2));
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testConnection();