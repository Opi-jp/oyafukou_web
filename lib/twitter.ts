import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import axios from 'axios';

// Twitter API設定
const TWITTER_API_KEY = process.env.TWITTER_API_KEY!;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET!;

// OAuth 1.0a設定
const oauth = new OAuth({
  consumer: {
    key: TWITTER_API_KEY,
    secret: TWITTER_API_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

interface TwitterToken {
  key: string;
  secret: string;
}

/**
 * 画像をTwitterにアップロード
 */
export async function uploadMedia(imageBuffer: Buffer, token: TwitterToken) {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('media', blob);

  const authHeader = oauth.toHeader(
    oauth.authorize(
      {
        url,
        method: 'POST'
      },
      token
    )
  );

  try {
    const response = await axios.post(url, formData, {
      headers: {
        ...authHeader,
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.media_id_string;
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
  const url = 'https://api.twitter.com/2/tweets';
  
  const data: any = { text };
  
  if (mediaId) {
    data.media = { media_ids: [mediaId] };
  }
  
  if (inReplyToStatusId) {
    data.reply = { in_reply_to_tweet_id: inReplyToStatusId };
  }

  const authHeader = oauth.toHeader(
    oauth.authorize(
      {
        url,
        method: 'POST'
      },
      token
    )
  );

  try {
    const response = await axios.post(url, data, {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      }
    });

    return response.data.data.id;
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
  }
  
  return results;
}