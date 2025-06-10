import { TwitterApi } from 'twitter-api-v2';

interface TwitterToken {
  key: string;
  secret: string;
}

/**
 * Twitterクライアントを作成
 */
function createClient(token: TwitterToken) {
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: token.key,
    accessSecret: token.secret,
  });
}

/**
 * 画像をTwitterにアップロード
 */
export async function uploadMedia(imageBuffer: Buffer, token: TwitterToken) {
  try {
    const client = createClient(token);
    const mediaId = await client.v1.uploadMedia(imageBuffer, {
      mimeType: 'image/jpeg'
    });
    return mediaId;
  } catch (error) {
    console.error('Media upload error:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
}

/**
 * ツイートを投稿
 */
export async function postTweet(
  text: string,
  token: TwitterToken,
  mediaId?: string,
  inReplyToStatusId?: string
) {
  try {
    const client = createClient(token);
    
    const tweetData: any = { text };
    
    if (mediaId) {
      tweetData.media = { media_ids: [mediaId] };
    }
    
    if (inReplyToStatusId) {
      tweetData.reply = { in_reply_to_tweet_id: inReplyToStatusId };
    }

    const result = await client.v2.tweet(tweetData);
    return result.data.id;
  } catch (error) {
    console.error('Tweet post error:', error);
    throw new Error('ツイートの投稿に失敗しました');
  }
}

/**
 * URLを含むテキストを分析して、URLを後ろに移動
 */
export function extractAndMoveUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];
  
  if (urls.length === 0) {
    return [text];
  }
  
  // URLを除いたテキスト
  let textWithoutUrls = text;
  urls.forEach(url => {
    textWithoutUrls = textWithoutUrls.replace(url, '').trim();
  });
  
  // URLを2ツイート目に
  const urlText = urls.join('\n');
  
  return [textWithoutUrls, urlText].filter(t => t.length > 0);
}

/**
 * スレッド形式でツイートを投稿
 */
export async function postThread(
  textList: string[],
  token: TwitterToken,
  mediaId?: string
): Promise<string[]> {
  const tweetIds: string[] = [];
  let previousTweetId: string | undefined;
  
  for (let i = 0; i < textList.length; i++) {
    const text = textList[i];
    const isFirstTweet = i === 0;
    
    try {
      const tweetId = await postTweet(
        text,
        token,
        isFirstTweet ? mediaId : undefined,
        previousTweetId
      );
      
      tweetIds.push(tweetId);
      previousTweetId = tweetId;
      
      // レート制限対策で少し待機
      if (i < textList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Tweet ${i + 1} failed:`, error);
      throw new Error(`スレッドの${i + 1}番目のツイートで失敗しました`);
    }
  }
  
  return tweetIds;
}

/**
 * 複数アカウントに一斉投稿
 */
export async function broadcastToAccounts(
  textList: string[],
  accounts: Array<{ handle: string; token: TwitterToken }>,
  mediaBuffer?: Buffer
): Promise<Array<{ handle: string; tweetIds?: string[]; error?: string }>> {
  const results = [];
  
  for (const account of accounts) {
    try {
      let mediaId: string | undefined;
      
      if (mediaBuffer) {
        mediaId = await uploadMedia(mediaBuffer, account.token);
      }
      
      const tweetIds = await postThread(textList, account.token, mediaId);
      
      results.push({
        handle: account.handle,
        tweetIds
      });
    } catch (error) {
      results.push({
        handle: account.handle,
        error: error instanceof Error ? error.message : '不明なエラー'
      });
    }
    
    // アカウント間でも少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}