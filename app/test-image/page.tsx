export default function TestImagePage() {
  const testImageUrl = "https://qycgp9nwsea3fxvl.public.blob.vercel-storage.com/1748838060553-yakiniku3.jpg";
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">画像テストページ</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">通常のimgタグ:</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={testImageUrl} 
            alt="Test image" 
            className="w-64 h-48 object-cover border"
            onLoad={() => console.log('Test image loaded successfully')}
            onError={(e) => console.error('Test image failed to load', e)}
          />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">背景画像として:</h2>
          <div 
            className="w-64 h-48 border"
            style={{ 
              backgroundImage: `url(${testImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </div>
        
        <div>
          <p className="text-sm text-gray-600">URL: {testImageUrl}</p>
        </div>
      </div>
    </div>
  );
}