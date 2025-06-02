import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Store from '@/models/Store';

export async function GET() {
  try {
    await connectDB();
    const stores = await Store.find({});
    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { error: '店舗情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const newStore = new Store(body);
    const savedStore = await newStore.save();
    return NextResponse.json(savedStore, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: '店舗の追加に失敗しました' },
      { status: 500 }
    );
  }
}