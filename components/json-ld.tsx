import { DEFAULT_KEYWORDS, getSiteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_PARENT, SITE_TAGLINE } from '@/lib/seo'

export function JsonLd() {
  const url = getSiteUrl()
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${url}/#org`,
        name: SITE_PARENT,
        url,
        brand: { '@type': 'Brand', name: SITE_NAME },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${url}/#app`,
        name: SITE_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'AggregateOffer',
          lowPrice: '0',
          highPrice: '9',
          priceCurrency: 'CAD',
          offerCount: 2,
        },
        description: SITE_DESCRIPTION,
        slogan: SITE_TAGLINE,
        featureList: [
          'Resume-based job matching',
          'Weekly top 10 Canada job matches',
          'One free ranked list',
          'Founding Pro weekly refresh at $9/month',
        ],
        keywords: DEFAULT_KEYWORDS.join(', '),
      },
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url,
        name: SITE_NAME,
        publisher: { '@id': `${url}/#org` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${url}/app`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
