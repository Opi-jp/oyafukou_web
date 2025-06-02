import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  console.log('Upload API called');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Blob token exists:', !!process.env.BLOB_READ_WRITE_TOKEN);
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('No file provided');
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    console.log('File info:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // ファイル名を生成（タイムスタンプ + 元のファイル名）
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;

    console.log('Uploading to Vercel Blob...');
    console.log('File name:', fileName);
    
    try {
      // Vercel Blobにアップロード
      const blob = await put(fileName, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      console.log('Upload successful:', blob.url);
      
      return NextResponse.json({ url: blob.url });
    } catch (blobError) {
      console.error('Blob upload error:', blobError);
      if (blobError instanceof Error) {
        console.error('Error name:', blobError.name);
        console.error('Error message:', blobError.message);
        console.error('Error stack:', blobError.stack);
      }
      throw blobError;
    }
  } catch (error) {
    console.error('Upload error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'アップロードに失敗しました: ' + errorMessage },
      { status: 500 }
    );
  }
}