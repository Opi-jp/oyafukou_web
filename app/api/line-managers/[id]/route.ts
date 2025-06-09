import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;

async function connectToDatabase(): Promise<Db> {
  const client = new MongoClient(uri);
  await client.connect();
  return client.db('oyafukou_db');
}

// DELETE: マネージャーを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const result = await db.collection('managers').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manager:', error);
    return NextResponse.json(
      { error: 'Failed to delete manager' },
      { status: 500 }
    );
  }
}

// PATCH: マネージャー情報を部分更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    const result = await db.collection('managers').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating manager:', error);
    return NextResponse.json(
      { error: 'Failed to update manager' },
      { status: 500 }
    );
  }
}