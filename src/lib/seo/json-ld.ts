import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SUPPORT_EMAIL,
  absoluteUrl,
} from './site';

export function buildOrganizationJsonLd(): Record<string, unknown> {
  const organization: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/icons/icon-512.png'),
      width: 512,
      height: 512,
    },
  };

  if (SUPPORT_EMAIL) {
    organization.email = SUPPORT_EMAIL;
    organization.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SUPPORT_EMAIL,
      availableLanguage: ['Portuguese'],
    };
  }

  return organization;
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: SITE_TAGLINE,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'pt-BR',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

export function buildSoftwareApplicationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE_NAME,
    alternateName: SITE_TAGLINE,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: 'pt-BR',
    url: SITE_URL,
    image: absoluteUrl('/opengraph-image'),
    description: SITE_DESCRIPTION,
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    featureList: [
      'Algoritmo científico de repetição espaçada FSRS-6',
      'Caderno de erros inteligente com revisão direcionada',
      'Cronograma semanal adaptativo para Residência Médica',
      'Análise de prevalência e desempenho por banca (ENARE, USP-SP, SUS-SP e mais)',
      'Registro de simulados, provas na íntegra e modo foco',
    ],
    offers: [
      {
        '@type': 'Offer',
        name: 'Plano Mensal - AdaptiveMed Pro',
        description:
          'Acesso completo a repetição espaçada adaptativa FSRS-6, simulados e métricas por 1 mês.',
        price: '7.99',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: absoluteUrl('/signup?plan=monthly'),
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '7.99',
          priceCurrency: 'BRL',
          referenceQuantity: {
            '@type': 'QuantitativeValue',
            value: 1,
            unitCode: 'MON',
          },
        },
      },
      {
        '@type': 'Offer',
        name: 'Plano Anual - AdaptiveMed VIP',
        description:
          'Acesso anual com todas as bancas do Brasil, cronograma adaptativo e suporte prioritário.',
        price: '69.90',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: absoluteUrl('/signup?plan=annual'),
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '69.90',
          priceCurrency: 'BRL',
          referenceQuantity: {
            '@type': 'QuantitativeValue',
            value: 1,
            unitCode: 'ANN',
          },
        },
      },
    ],
  };
}

export function buildFaqJsonLd(
  items: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'pt-BR',
    mainEntity: items
      .filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0)
      .map((item) => ({
        '@type': 'Question',
        name: item.question.trim(),
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer.trim(),
        },
      })),
  };
}

export function buildArticleJsonLd(opts: {
  title: string;
  description: string;
  urlPath: string;
  datePublished: string;
  dateModified: string;
  keywords?: string[];
}): Record<string, unknown> {
  const articleUrl = absoluteUrl(opts.urlPath);
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title.trim(),
    description: opts.description.trim(),
    inLanguage: 'pt-BR',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    url: articleUrl,
    image: {
      '@type': 'ImageObject',
      url: absoluteUrl('/opengraph-image'),
      width: 1200,
      height: 630,
    },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/icons/icon-512.png'),
        width: 512,
        height: 512,
      },
    },
  };

  const cleanedKeywords = opts.keywords
    ?.map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
  if (cleanedKeywords && cleanedKeywords.length > 0) {
    article.keywords = cleanedKeywords.join(', ');
  }

  return article;
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
      .filter((item) => item.name.trim().length > 0)
      .map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name.trim(),
        item: absoluteUrl(item.path),
      })),
  };
}
