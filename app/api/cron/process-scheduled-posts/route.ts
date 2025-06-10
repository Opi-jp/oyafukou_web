import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScheduledPost from '@/models/ScheduledPost';
import TwitterToken from '@/models/TwitterToken';
import PostLog from '@/models/PostLog';
import { broadcastToAccounts } from '@/lib/twitter';

// Vercel Cronジョブから呼び出される
export async function GET(request: NextRequest) {
  // セキュリティ: Cronジョブからのみ実行可能
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    // 現在時刻より前の予約投稿を取得
    const now = new Date();
    const pendingPosts = await ScheduledPost.find({
      status: 'pending',
      scheduledAt: { $lte: now }
    }).limit(10); // 一度に処理する最大数
    
    console.log(`Processing ${pendingPosts.length} scheduled posts`);
    
    const results = [];
    
    for (const post of pendingPosts) {
      try {
        await processPost(post._id.toString());
        results.push({ id: post._id, status: 'processed' });
      } catch (error) {
        console.error(`Failed to process post ${post._id}:`, error);
        results.push({ 
          id: post._id, 
          status: 'failed',
          error: error instanceof Error ? error.message : '不明なエラー'
        });
      }
    }
    
    return NextResponse.json({
      processed: results.length,
      results
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'スケジューラーエラー' },
      { status: 500 }
    );
  }
}

// 投稿処理の実装
async function processPost(postId: string) {
  console.log(`Processing post: ${postId}`);
  
  const post = await ScheduledPost.findById(postId);
  if (!post || post.status !== 'pending') {
    console.log(`Post ${postId} is not pending or not found`);
    return;
  }
  
  try {
    // アカウント情報を取得
    const accounts = await TwitterToken.find({
      _id: { $in: post.accountIds },
      isActive: true
    });
    
    if (accounts.length === 0) {
      await ScheduledPost.findByIdAndUpdate(postId, {
        status: 'failed',
        error: '有効なアカウントが見つかりません',
        updatedAt: new Date()
      });
      return;
    }
    
    // メディアファイルを取得（必要な場合）
    let mediaBuffer: Buffer | undefined;
    if (post.imagePath && post.mediaType === 'image') {
      try {
        console.log(`Fetching media from: ${post.imagePath}`);
        const response = await fetch(post.imagePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        mediaBuffer = Buffer.from(arrayBuffer);
        console.log(`Media fetched, size: ${mediaBuffer.length} bytes`);
      } catch (error) {
        console.error('Media fetch error:', error);
        // メディア取得に失敗してもテキストのみで続行
      }
    }
    
    // アカウント情報を準備
    const accountsWithTokens = accounts.map(acc => ({
      handle: acc.twitterHandle,
      token: {
        key: acc.accessToken,
        secret: acc.accessTokenSecret
      }
    }));
    
    console.log(`Broadcasting to ${accountsWithTokens.length} accounts`);
    
    // 投稿実行
    const results = await broadcastToAccounts(
      post.textList,
      accountsWithTokens,
      mediaBuffer
    );
    
    // 結果を処理
    const successfulPosts = results.filter(r => r.tweetIds);
    const failedPosts = results.filter(r => r.error);
    
    console.log(`Success: ${successfulPosts.length}, Failed: ${failedPosts.length}`);
    
    if (successfulPosts.length > 0) {
      // 成功した投稿をログに記録
      for (const result of successfulPosts) {
        const account = accounts.find(a => a.twitterHandle === result.handle);
        if (account) {
          await PostLog.create({
            textList: post.textList,
            mediaType: post.mediaType,
            mediaPath: post.imagePath,
            sourceAccount: `@${result.handle}`,
            tweetIds: result.tweetIds,
            threadUrl: `https://twitter.com/${result.handle}/status/${result.tweetIds?.[0]}`,
            storeId: account.storeId
          });
        }
      }
      
      // 投稿ステータスを更新
      await ScheduledPost.findByIdAndUpdate(postId, {
        status: failedPosts.length > 0 ? 'failed' : 'posted',
        postedTweetIds: successfulPosts.map(r => ({
          accountId: r.handle,
          tweetIds: r.tweetIds || []
        })),
        error: failedPosts.length > 0 
          ? `一部失敗: ${failedPosts.map(f => `@${f.handle}: ${f.error}`).join(', ')}`
          : undefined,
        updatedAt: new Date()
      });
    } else {
      // 全て失敗
      await ScheduledPost.findByIdAndUpdate(postId, {
        status: 'failed',
        error: '全てのアカウントで投稿に失敗しました',
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error(`Error processing post ${postId}:`, error);
    await ScheduledPost.findByIdAndUpdate(postId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '不明なエラー',
      updatedAt: new Date()
    });
  }
}