import { NextRequest, NextResponse } from 'next/server';
import { messagingApi } from '@line/bot-sdk';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envVars = {
      LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'Set' : 'Not set',
      LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ? 'Set' : 'Not set',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'Not set',
    };

    // Check if tokens are properly formatted (without exposing them)
    const tokenInfo: any = {
      accessTokenLength: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0,
      channelSecretLength: process.env.LINE_CHANNEL_SECRET?.length || 0,
      accessTokenPrefix: process.env.LINE_CHANNEL_ACCESS_TOKEN?.substring(0, 10) || 'N/A',
    };

    // Test LINE Bot SDK initialization
    let sdkStatus = 'Not initialized';
    let sdkError = null;
    
    if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET) {
      try {
        const client = new messagingApi.MessagingApiClient({
          channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        });
        
        // Try to get bot info to verify the token is valid
        try {
          const botInfo = await client.getBotInfo();
          sdkStatus = 'Initialized and verified';
          
          // Add bot info to response
          tokenInfo.botInfo = {
            userId: botInfo.userId,
            basicId: botInfo.basicId,
            displayName: botInfo.displayName,
            pictureUrl: botInfo.pictureUrl,
          };
        } catch (verifyError: any) {
          sdkStatus = 'Initialized but verification failed';
          sdkError = verifyError.message || 'Unknown verification error';
        }
      } catch (error: any) {
        sdkStatus = 'Initialization failed';
        sdkError = error.message || 'Unknown error';
      }
    }

    // Webhook URL information
    const webhookUrl = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/line-webhook`
      : 'Cannot generate - NEXT_PUBLIC_BASE_URL not set';

    // Get current request URL for reference
    const currentUrl = request.url;
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';

    // Response data
    const debugInfo = {
      status: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
      envVars,
      tokenInfo,
      sdk: {
        status: sdkStatus,
        error: sdkError,
      },
      webhook: {
        configuredUrl: webhookUrl,
        expectedPath: '/api/line-webhook',
        instructions: 'This URL should be set in LINE Developers Console',
        testCommand: `curl -X POST ${webhookUrl} -H "Content-Type: application/json" -H "x-line-signature: test" -d '{"events":[]}'`,
      },
      botInfo: tokenInfo.botInfo || {},
      troubleshooting: {
        qrCodeNotWorking: [
          '1. LINE Developers Console でWebhook URLが正しく設定されているか確認',
          '2. Webhookが「利用する」になっているか確認',
          '3. LINE Official Account Manager で「応答メッセージ」が「オフ」になっているか確認',
          '4. 「あいさつメッセージ」も無効化されているか確認',
          '5. Bot情報を確認（Basic ID、Display Name）',
        ],
        checkWebhookDelivery: 'LINE Developers Console → Messaging API → Webhook settings → 「検証」ボタンで確認',
      },
      request: {
        currentUrl,
        host,
        protocol,
        suggestedBaseUrl: `${protocol}://${host}`,
      },
      nextSteps: [
        'Ensure LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET are set in Vercel environment variables',
        'Set NEXT_PUBLIC_BASE_URL to your deployment URL (e.g., https://your-app.vercel.app)',
        'Configure webhook URL in LINE Developers Console',
        'Enable webhook and disable auto-reply in LINE Official Account Manager',
      ],
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}