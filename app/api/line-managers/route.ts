import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;

async function connectToDatabase(): Promise<Db> {
  const client = new MongoClient(uri);
  await client.connect();
  return client.db('oyafukou_db');
}

// GET: マネージャー一覧を取得
export async function GET() {
  try {
    const db = await connectToDatabase();
    const managers = await db.collection('managers').find({}).toArray();
    
    return NextResponse.json(managers);
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch managers' },
      { status: 500 }
    );
  }
}

// POST: 新規マネージャーを追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineUserId, storeId, managerName, isActive } = body;

    if (!lineUserId || !storeId || !managerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    
    // 既存のLINEユーザーIDをチェック
    const existing = await db.collection('managers').findOne({ lineUserId });
    if (existing) {
      return NextResponse.json(
        { error: 'このLINEユーザーIDは既に登録されています' },
        { status: 400 }
      );
    }

    const manager = {
      lineUserId,
      storeId,
      managerName,
      isActive: isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('managers').insertOne(manager);
    
    return NextResponse.json({
      _id: result.insertedId,
      ...manager
    });
  } catch (error) {
    console.error('Error creating manager:', error);
    return NextResponse.json(
      { error: 'Failed to create manager' },
      { status: 500 }
    );
  }
}