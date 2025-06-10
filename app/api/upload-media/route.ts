import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'ファイルがありません' },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedVideoTypes = ['video/mp4'];
    const isImage = allowedImageTypes.includes(file.type);
    const isVideo = allowedVideoTypes.includes(file.type);
    
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'JPEG、PNG、GIF画像またはMP4動画のみアップロード可能です' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxSize = isImage ? maxImageSize : maxVideoSize;
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `ファイルサイズは${isImage ? '5MB' : '100MB'}以下にしてください` },
        { status: 400 }
      );
    }

    // ファイル名生成
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const folder = isImage ? 'images' : 'videos';
    const filename = `social-media/${folder}/${timestamp}.${extension}`;

    // Vercel Blobにアップロード
    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      mediaType: isImage ? 'image' : 'video',
      filename: filename,
      size: file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}