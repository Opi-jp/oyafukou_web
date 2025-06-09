import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI!;
    const client = new MongoClient(uri);
    await client.connect();
    
    // 両方のデータベースをチェック
    const results: Record<string, any> = {};
    
    // parent_site_admin をチェック
    const parentDb = client.db('parent_site_admin');
    results.parent_site_admin = {
      managers: await parentDb.collection('managers').find({}).toArray(),
      stores: await parentDb.collection('stores').countDocuments()
    };
    
    // oyafukou_db をチェック
    const oyafukouDb = client.db('oyafukou_db');
    results.oyafukou_db = {
      managers: await oyafukouDb.collection('managers').find({}).toArray(),
      stores: await oyafukouDb.collection('stores').countDocuments()
    };
    
    await client.close();
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}