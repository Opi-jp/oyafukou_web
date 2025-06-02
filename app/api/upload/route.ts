import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  console.log('Upload API called');
  
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
    
    // Vercel Blobにアップロード
    const blob = await put(fileName, file, {
      access: 'public',
    });

    console.log('Upload successful:', blob.url);
    
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'アップロードに失敗しました: ' + errorMessage },
      { status: 500 }
    );
  }
}