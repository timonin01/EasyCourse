import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { FadeIn } from '../components/ui';
import { PRIVACY_CONSENT_EFFECTIVE_DATE, PRIVACY_CONSENT_VERSION } from '../constants/privacyConsent';
import { SITE_ORIGIN } from '../constants/seo';
import { usePageMeta } from '../hooks/usePageMeta';

export function PersonalDataConsent() {
  usePageMeta({
    title: 'Согласие на обработку персональных данных — EasyCourse',
    description:
      'Согласие субъекта персональных данных на обработку персональных данных сервисом EasyCourse.',
    canonicalUrl: `${SITE_ORIGIN}/consent`,
  });

  return (
    <div className="min-h-screen p-4 py-10">
      <FadeIn className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex flex-col items-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-dark-100">EasyCourse</h1>
          </Link>
          <p className="mt-2 text-dark-400">Согласие на обработку персональных данных</p>
        </div>

        <article className="surface space-y-6 rounded-brand-xl p-6 text-sm leading-relaxed text-dark-300 sm:p-8">
          <p className="text-dark-500">
            Версия: {PRIVACY_CONSENT_VERSION}. Дата: {PRIVACY_CONSENT_EFFECTIVE_DATE}
          </p>

          <p>
            Настоящим я, субъект персональных данных, свободно, своей волей и в своём интересе даю
            согласие оператору персональных данных —{' '}
            <span className="text-dark-100">Тимонину Андрею Владимировичу</span> (контакт:{' '}
            <a
              href="mailto:systemalert34@gmail.com"
              className="text-primary-400 hover:text-primary-300"
            >
              systemalert34@gmail.com
            </a>
            ) — на обработку моих персональных данных в целях регистрации и использования сервиса
            EasyCourse ({' '}
            <a
              href="https://easy-course.ru"
              className="text-primary-400 hover:text-primary-300"
              target="_blank"
              rel="noreferrer"
            >
              https://easy-course.ru
            </a>
            ).
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-dark-100">Перечень персональных данных</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>имя (в том числе отображаемое имя);</li>
              <li>адрес электронной почты;</li>
              <li>пароль (в хешированном виде);</li>
              <li>код приглашения (при регистрации по приглашению);</li>
              <li>
                данные интеграции со Stepik (client id, client secret, access token) — при
                самостоятельном подключении;
              </li>
              <li>
                сведения, необходимые для работы AI-функций сервиса (тексты запросов и связанные
                фрагменты курса);
              </li>
              <li>
                технические данные сессии и безопасности (в том числе IP-адрес, сведения о сессии).
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-dark-100">Действия с данными</h2>
            <p>
              Согласие даётся на сбор, запись, систематизацию, накопление, хранение, уточнение
              (обновление, изменение), извлечение, использование, передачу (предоставление, доступ),
              удаление и уничтожение персональных данных смешанным (автоматизированным и
              неавтоматизированным) способом с передачей по сети Интернет.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-dark-100">Передача и трансграничная обработка</h2>
            <p>
              Я уведомлён(а), что для оказания услуг сервиса данные могут передаваться провайдерам
              инфраструктуры, почтовой доставки, платформе Stepik и провайдерам AI/LLM в объёме,
              необходимом для исполнения моего запроса. Такая обработка может включать
              трансграничную передачу персональных данных.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-dark-100">Срок действия согласия</h2>
            <p>
              Согласие действует до достижения целей обработки, отзыва согласия, удаления учётной
              записи либо прекращения деятельности сервиса EasyCourse — в зависимости от того, что
              наступит раньше.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-dark-100">Отзыв согласия</h2>
            <p>
              Согласие может быть отозвано путём направления обращения на{' '}
              <a
                href="mailto:systemalert34@gmail.com"
                className="text-primary-400 hover:text-primary-300"
              >
                systemalert34@gmail.com
              </a>
              . Отзыв согласия может сделать невозможным дальнейшее использование сервиса.
            </p>
          </section>

          <p>
            Порядок обработки персональных данных также описан в{' '}
            <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
              Политике обработки персональных данных
            </Link>
            . Настоящее согласие является отдельным документом и не является пользовательским
            соглашением / офертой.
          </p>
        </article>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-dark-400">
          <Link to="/register" className="hover:text-dark-200">
            К регистрации
          </Link>
          <Link to="/privacy" className="hover:text-dark-200">
            Политика
          </Link>
          <Link to="/" className="hover:text-dark-200">
            На главную
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
