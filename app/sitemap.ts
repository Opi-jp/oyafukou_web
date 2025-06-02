import { MetadataRoute } from 'next'
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://oyafukou-web.vercel.app'
  
  // 動的に店舗情報を取得
  let stores = []
  try {
    const response = await fetch(`${baseUrl}/api/stores`)
    if (response.ok) {
      stores = await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch stores for sitemap:', error)
  }
  
  // 静的ページ
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/access`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]
  
  // 店舗ページ
  const storePages = stores.map((store: any) => ({
    url: `${baseUrl}/stores/${store._id}`,
    lastModified: new Date(store.updatedAt || store.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))
  
  return [...staticPages, ...storePages]
}