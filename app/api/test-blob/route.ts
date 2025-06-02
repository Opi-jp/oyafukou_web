import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    // 環境変数の確認
    const tokenExists = !!process.env.BLOB_READ_WRITE_TOKEN;
    const tokenLength = process.env.BLOB_READ_WRITE_TOKEN?.length || 0;
    
    console.log('Test Blob API called');
    console.log('Token exists:', tokenExists);
    console.log('Token length:', tokenLength);
    
    // Blobストレージの接続テスト
    let blobList;
    try {
      blobList = await list({
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log('Blob list successful, count:', blobList.blobs.length);
    } catch (listError) {
      console.error('Blob list error:', listError);
      throw listError;
    }
    
    return NextResponse.json({
      status: 'success',
      tokenExists,
      tokenLength,
      blobCount: blobList.blobs.length,
      environment: process.env.NODE_ENV,
      message: 'Vercel Blob接続テスト成功'
    });
  } catch (error) {
    console.error('Test blob error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenExists: !!process.env.BLOB_READ_WRITE_TOKEN,
      environment: process.env.NODE_ENV,
    }, { status: 500 });
  }
}