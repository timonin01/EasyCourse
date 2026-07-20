import { useEffect } from 'react';
import {
  SITE_CANONICAL_URL,
  SITE_DESCRIPTION,
  SITE_OG_IMAGE_URL,
  SITE_TITLE,
} from '../constants/seo';

type PageMetaOptions = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  /** When true, discourage indexing (login/app pages). */
  noIndex?: boolean;
};

function setNamedMeta(name: string, content: string) {
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setPropertyMeta(property: string, content: string) {
  let el = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Keeps document title / description / OG tags in sync for the current route.
 * Static tags in index.html remain the crawler fallback for the landing.
 */
export function usePageMeta({
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
  canonicalUrl = SITE_CANONICAL_URL,
  ogImageUrl = SITE_OG_IMAGE_URL,
  noIndex = false,
}: PageMetaOptions = {}) {
  useEffect(() => {
    document.title = title;

    setNamedMeta('description', description);
    setNamedMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setCanonical(canonicalUrl);

    setPropertyMeta('og:title', title);
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:url', canonicalUrl);
    setPropertyMeta('og:image', ogImageUrl);

    setNamedMeta('twitter:title', title);
    setNamedMeta('twitter:description', description);
    setNamedMeta('twitter:image', ogImageUrl);
  }, [title, description, canonicalUrl, ogImageUrl, noIndex]);
}
