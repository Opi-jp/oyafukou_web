export function SiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "八丈島親不孝通り",
    "url": "https://oyafukou-web.vercel.app",
    "description": "八丈島唯一のはしご酒エリア。焼肉、寿司、ラーメン、カラオケまで、島の夜を彩る全店舗情報",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://oyafukou-web.vercel.app/stores/{search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function StoreStructuredData({ store }: { store: any }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": store.name,
    "description": store.description,
    "url": `https://oyafukou-web.vercel.app/stores/${store._id}`,
    "telephone": store.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": store.address,
      "addressLocality": "八丈島",
      "addressRegion": "東京都",
      "addressCountry": "JP"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": store.openingHours.split('-')[0],
      "closes": store.openingHours.split('-')[1]
    },
    "servesCuisine": store.category,
    "priceRange": "¥¥",
    "image": store.topImage || store.exteriorImage
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}