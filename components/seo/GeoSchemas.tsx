'use client';

/**
 * GEO Schemas - JSON-LD para optimización en motores de IA
 * Generado con skill eGEOagents (schema-generator)
 * 
 * Incluye:
 * - LocalBusiness (organización)
 * - Product (aguacates)
 * - FAQPage (preguntas frecuentes)
 */

export function GeoSchemas() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://tusaguacates.com/#organization",
    "name": "Tus Aguacates",
    "description": "El proveedor líder de aguacates premium y productos frescos del Eje Cafetero. Entrega directa a hogares y negocios en Bogotá.",
    "url": "https://tusaguacates.com",
    "telephone": "+573203062007",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bogotá",
      "addressRegion": "Cundinamarca",
      "addressCountry": "CO"
    },
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "addressLocality": "Bogotá",
        "addressCountry": "CO"
      },
      "geoRadius": "50 km"
    },
    "priceRange": "$$",
    "openingHours": "Mo-Sa 08:00-18:00",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127",
      "bestRating": "5"
    },
    "image": "https://tusaguacates.com/images/og-social.png",
    "sameAs": [
      "https://www.instagram.com/tusaguacates"
    ]
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Aguacate Hass Premium",
    "description": "Aguacate Hass del Eje Cafetero, el más solicitado para guacamole y preparaciones gourmet. Piel rugosa que cambia a negra al madurar, pulpa cremosa.",
    "image": "https://tusaguacates.com/images/aguacate-hass.png",
    "brand": {
      "@type": "Brand",
      "name": "Tus Aguacates"
    },
    "category": "Frutas y Verduras",
    "offers": {
      "@type": "Offer",
      "url": "https://tusaguacates.com",
      "priceCurrency": "COP",
      "price": "8500",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Tus Aguacates"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "89"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Hacen entregas el mismo día en Bogotá?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, si tu pedido está confirmado antes de las 10am, recibís tus aguacates y productos frescos el mismo día en Bogotá."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué variedades de aguacate venden?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ofrecemos tres variedades premium: Hass (el más solicitado, ideal para guacamole), Papelillo/Lorena (madura rápido, perfecto para consumo fresco) y Semil 40 (pulpa ultra cremosa)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puedo comprar para mi restaurante o empresa?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, atendemos restaurantes, empresas de catering, colegios, hospitales y comercios minoristas. Ofrecemos precios especiales por volumen."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
