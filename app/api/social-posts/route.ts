import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScheduledPost from '@/models/ScheduledPost';
import TwitterToken from '@/models/TwitterToken';
import PostLog from '@/models/PostLog';
import { extractAndMoveUrls, broadcastToAccounts } from '@/lib/twitter';

export async function GET() {
  try {
    await connectDB();
    
    const posts = await ScheduledPost.find()
      .sort({ createdAt: -1 })
      .limit(100);
    
    // アカウント情報を追加
    const accountIds = [...new Set(posts.flatMap(p => p.accountIds))];
    const accounts = await TwitterToken.find({ _id: { $in: accountIds } });
    const accountMap = new Map(accounts.map(a => [a._id.toString(), a]));
    
    const postsWithAccounts = posts.map(post => ({
      ...post.toObject(),
      accounts: post.accountIds
        .map(id => accountMap.get(id))
        .filter(Boolean)
        .map(acc => ({
          twitterHandle: acc.twitterHandle,
          displayName: acc.displayName
        }))
    }));
    
    return NextResponse.json(postsWithAccounts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: '投稿一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    // URLを含むテキストの処理
    let processedTextList = [...body.textList];
    if (processedTextList.length > 0) {
      const firstText = processedTextList[0];
      const extracted = extractAndMoveUrls(firstText);
      
      if (extracted.length > 1) {
        // URLが抽出された場合、テキストリストを更新
        processedTextList = [
          extracted[0],
          ...extracted.slice(1),
          ...processedTextList.slice(1)
        ];
      }
    }
    
    // 投稿を作成
    const post = await ScheduledPost.create({
      textList: processedTextList,
      imagePath: body.mediaPath,
      mediaType: body.mediaType || 'none',
      accountIds: body.accountIds,
      scheduledAt: body.scheduledAt,
      broadcast: body.broadcast || false,
      source: body.source || 'official',
      createdBy: body.createdBy
    });
    
    // 即時投稿の場合
    const scheduledDate = new Date(body.scheduledAt);
    const now = new Date();
    
    if (scheduledDate <= now) {
      // 即座に投稿処理を実行
      await processPost(post._id.toString());
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: '投稿の作成に失敗しました' },
      { status: 500 }
    );
  }
}

// 投稿処理の実装
async function processPost(postId: string) {
  try {
    const post = await ScheduledPost.findById(postId);
    if (!post || post.status !== 'pending') return;
    
    // アカウント情報を取得
    const accounts = await TwitterToken.find({
      _id: { $in: post.accountIds },
      isActive: true
    });
    
    if (accounts.length === 0) {
      await ScheduledPost.findByIdAndUpdate(postId, {
        status: 'failed',
        error: '有効なアカウントが見つかりません'
      });
      return;
    }
    
    // メディアファイルを取得（必要な場合）
    let mediaBuffer: Buffer | undefined;
    if (post.imagePath && post.mediaType === 'image') {
      try {
        const response = await fetch(post.imagePath);
        const arrayBuffer = await response.arrayBuffer();
        mediaBuffer = Buffer.from(arrayBuffer);
      } catch (error) {
        console.error('Media fetch error:', error);
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
    
    // 投稿実行
    const results = await broadcastToAccounts(
      post.textList,
      accountsWithTokens,
      mediaBuffer
    );
    
    // 結果を処理
    const successfulPosts = results.filter(r => r.tweetIds);
    const failedPosts = results.filter(r => r.error);
    
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
          : undefined
      });
    } else {
      // 全て失敗
      await ScheduledPost.findByIdAndUpdate(postId, {
        status: 'failed',
        error: '全てのアカウントで投稿に失敗しました'
      });
    }
  } catch (error) {
    console.error('Error processing post:', error);
    await ScheduledPost.findByIdAndUpdate(postId, {
      status: 'failed',
      error: error instanceof Error ? error.message : '不明なエラー'
    });
  }
}