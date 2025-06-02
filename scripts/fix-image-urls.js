const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fixImageUrls() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Store = mongoose.models.Store || mongoose.model('Store', new mongoose.Schema({}, { strict: false }));
    
    // 画像URLの対応表
    const imageMapping = {
      '/uploads/store-sannenme-uwaki.jpg': '/exterior/三年目の浮気.jpg',
      '/uploads/store-yakiniku.jpg': '/exterior/sannenme-uwaki.jpg',
      '/uploads/store-namihei.jpg': '/exterior/namihei.jpg',
      '/uploads/store-shuchinikulin.jpg': '/exterior/酒池肉林.jpg',
      '/uploads/store-rizonto.jpg': '/exterior/リーゼント.jpg',
      '/uploads/store-aiga-suisan.jpg': '/exterior/aiga-suisan.jpg',
      '/uploads/store-soba-izakaya.jpg': '/exterior/namihei.jpg',
      '/uploads/store-j-soul.jpg': '/exterior/Jsoul.jpg',
      '/uploads/store-club-gets.jpg': '/exterior/GETZ.jpeg',
      '/uploads/store-okonomiyaki.jpg': '/exterior/lava.jpg',
      '/uploads/store-mens-club.jpg': '/exterior/mens-club.jpg',
      '/uploads/store-sannenme-kentaiki.jpg': '/exterior/sannenme-kentaiki.jpg'
    };

    // すべての店舗を取得
    const stores = await Store.find({});
    console.log(`\n📊 Found ${stores.length} stores to check`);

    let updatedCount = 0;
    
    for (const store of stores) {
      let updated = false;
      
      // exteriorImageを修正
      if (store.exteriorImage && imageMapping[store.exteriorImage]) {
        console.log(`\n🔧 Fixing ${store.name}:`);
        console.log(`  Before: ${store.exteriorImage}`);
        console.log(`  After:  ${imageMapping[store.exteriorImage]}`);
        
        store.exteriorImage = imageMapping[store.exteriorImage];
        updated = true;
      }
      
      // imagesフィールドも修正
      if (store.images && store.images.length > 0) {
        store.images = store.images.map(img => imageMapping[img] || img);
        updated = true;
      }
      
      if (updated) {
        await store.save();
        updatedCount++;
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} stores`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// 実行前に確認
console.log('⚠️  This script will update image URLs in the database.');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  fixImageUrls();
}, 3000);