import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from '../components/ui';
import {
  PRODUCT_DESCRIPTION,
  PRODUCT_FEATURES,
  PRODUCT_TAGLINE,
} from '../constants/productInfo';
import {
  LANDING_FAQ,
  LANDING_SEO_PARAGRAPHS,
  SITE_CANONICAL_URL,
  SITE_DESCRIPTION,
  SITE_ORIGIN,
  SITE_TITLE,
} from '../constants/seo';
import { usePageMeta } from '../hooks/usePageMeta';

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: LANDING_FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EasyCourse',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  url: SITE_ORIGIN,
  description: SITE_DESCRIPTION,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'RUB',
  },
};

function upsertJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(data);
}

export function Landing() {
  usePageMeta({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    canonicalUrl: SITE_CANONICAL_URL,
  });

  useEffect(() => {
    upsertJsonLd('easycourse-faq-jsonld', faqJsonLd);
    upsertJsonLd('easycourse-app-jsonld', orgJsonLd);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-dark-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,197,94,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(51,65,85,0.45),_transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(248,250,252,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(248,250,252,0.9) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-10 flex items-center justify-between gap-4 sm:mb-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-dark-300">EasyCourse</span>
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-dark-400 transition-colors hover:text-dark-100"
          >
            Войти
          </Link>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="mb-10 sm:mb-12">
            <h1 className="text-4xl font-semibold tracking-tight text-dark-50 sm:text-5xl">
              EasyCourse
            </h1>
            <p className="mt-3 max-w-xl text-lg text-dark-300 sm:text-xl">{PRODUCT_TAGLINE}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-dark-400 sm:text-base">
              {PRODUCT_DESCRIPTION}
            </p>
            <div className="mt-5 max-w-2xl space-y-3 text-sm leading-relaxed text-dark-400 sm:text-base">
              {LANDING_SEO_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="mb-10 sm:mb-12">
            <h2 className="mb-5 text-sm font-medium uppercase tracking-wide text-dark-500">
              Что можно делать
            </h2>
            <ul className="divide-y divide-dark-700/60 border-y border-dark-700/60">
              {PRODUCT_FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0 flex gap-3">
                    <feature.icon className="mt-0.5 h-4 w-4 shrink-0 text-dark-500" />
                    <div>
                      <p className="text-sm font-medium text-dark-100">{feature.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-dark-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={feature.tryPath}
                    className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-primary-400 transition-colors hover:text-primary-300 sm:self-center"
                  >
                    Попробовать
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10 sm:mb-12" aria-labelledby="landing-faq-heading">
            <h2
              id="landing-faq-heading"
              className="mb-5 text-sm font-medium uppercase tracking-wide text-dark-500"
            >
              Частые вопросы
            </h2>
            <div className="divide-y divide-dark-700/60 border-y border-dark-700/60">
              {LANDING_FAQ.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-dark-100 marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {item.question}
                      <span
                        className="shrink-0 text-dark-500 transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-dark-400">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-auto flex flex-col gap-3 border-t border-dark-700/60 pt-8 sm:flex-row sm:items-center">
            <Link to="/register" className="sm:flex-1">
              <Button size="lg" className="w-full" icon={<ArrowRight className="h-5 w-5" />}>
                Зарегистрироваться
              </Button>
            </Link>
            <Link to="/login" className="sm:flex-1">
              <Button size="lg" variant="secondary" className="w-full">
                Войти
              </Button>
            </Link>
          </section>

          <p className="mt-6 text-center text-xs text-dark-500">
            <Link to="/consent" className="hover:text-dark-300">
              Согласие на обработку ПДн
            </Link>
            {' · '}
            <Link to="/privacy" className="hover:text-dark-300">
              Политика обработки персональных данных
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
