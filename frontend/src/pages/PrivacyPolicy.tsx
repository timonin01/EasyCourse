import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { FadeIn } from '../components/ui';
import { SITE_ORIGIN } from '../constants/seo';
import { usePageMeta } from '../hooks/usePageMeta';

const EFFECTIVE_DATE = '24 июля 2026 г.';

export function PrivacyPolicy() {
  usePageMeta({
    title: 'Политика обработки персональных данных — EasyCourse',
    description:
      'Политика обработки персональных данных сервиса EasyCourse: какие данные собираются, зачем и как защищаются.',
    canonicalUrl: `${SITE_ORIGIN}/privacy`,
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
          <p className="mt-2 text-dark-400">Политика обработки персональных данных</p>
        </div>

        <article className="surface space-y-8 rounded-brand-xl p-6 text-sm leading-relaxed text-dark-300 sm:p-8">
          <p className="text-dark-500">Дата вступления в силу: {EFFECTIVE_DATE}</p>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">1. Общие положения</h2>
            <p>
              Настоящая Политика определяет порядок обработки персональных данных пользователей
              сервиса EasyCourse (далее — Сервис), доступного по адресу{' '}
              <a
                href="https://easy-course.ru"
                className="text-primary-400 hover:text-primary-300"
                target="_blank"
                rel="noreferrer"
              >
                https://easy-course.ru
              </a>
              .
            </p>
            <p>
              Политика разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ
              «О персональных данных». Согласие на обработку персональных данных оформляется
              отдельным документом при регистрации в Сервисе (
              <Link to="/consent" className="text-primary-400 hover:text-primary-300">
                Согласие на обработку персональных данных
              </Link>
              ).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">2. Оператор персональных данных</h2>
            <p>
              Оператор: <span className="text-dark-100">Тимонин Андрей Владимирович</span>
            </p>
            <p>
              Контактный email:{' '}
              <a
                href="mailto:systemalert34@gmail.com"
                className="text-primary-400 hover:text-primary-300"
              >
                systemalert34@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">3. Какие данные обрабатываются</h2>
            <p>Оператор может обрабатывать следующие данные:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>имя;</li>
              <li>адрес электронной почты;</li>
              <li>пароль (хранится в хешированном виде);</li>
              <li>код приглашения (при регистрации по приглашению);</li>
              <li>
                данные для интеграции со Stepik: client id, client secret, access token — если
                пользователь самостоятельно подключает аккаунт Stepik;
              </li>
              <li>
                содержание курсов, созданных или импортированных пользователем (модули, уроки, шаги
                и связанные материалы);
              </li>
              <li>
                сообщения и запросы к AI-функциям Сервиса (включая контекст курса, необходимый для
                генерации и правок);
              </li>
              <li>
                технические данные, необходимые для работы Сервиса: данные сессии, JWT-токены,
                журналы запросов, IP-адрес и сведения о браузере — в объёме, достаточном для
                обеспечения безопасности и работоспособности.
              </li>
            </ul>
            <p>Оператор не запрашивает паспортные данные, ИНН и платёжные реквизиты на текущем этапе.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">4. Цели обработки</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>регистрация, аутентификация и предоставление доступа к Сервису;</li>
              <li>создание, редактирование и хранение курсов пользователя;</li>
              <li>синхронизация материалов с платформой Stepik по инициативе пользователя;</li>
              <li>работа AI-агента и других AI-инструментов Сервиса;</li>
              <li>связь с пользователем по вопросам работы Сервиса и поддержки;</li>
              <li>обеспечение безопасности, предотвращение злоупотреблений и устранение сбоев.</li>
            </ul>
            <p>
              Оператор не использует персональные данные для рекламных рассылок и не продаёт их
              третьим лицам.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">5. Правовые основания</h2>
            <p>Обработка осуществляется на основании:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>согласия субъекта персональных данных (при регистрации в Сервисе);</li>
              <li>
                необходимости обработки для исполнения договора / предоставления функциональности
                Сервиса по запросу пользователя.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">6. Передача данных третьим лицам</h2>
            <p>
              Для работы Сервиса данные могут передаваться (или становиться доступными) следующим
              категориям получателей исключительно в целях оказания услуги:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <span className="text-dark-100">Stepik</span> — при подключении интеграции и
                выполнении пользователем действий синхронизации, обновления или удаления материалов
                на стороне Stepik;
              </li>
              <li>
                <span className="text-dark-100">провайдеры AI / LLM</span> (в том числе сервис Provod
                и связанные API) — для обработки запросов пользователя к AI-функциям; в таких
                запросах могут передаваться тексты сообщений и фрагменты содержимого курса;
              </li>
              <li>
                <span className="text-dark-100">инфраструктурные провайдеры</span> (хостинг, база
                данных, почтовая доставка) — для размещения Сервиса, хранения данных и отправки
                писем подтверждения.
              </li>
            </ul>
            <p>
              Оператор не передаёт персональные данные третьим лицам для их самостоятельного
              маркетинга.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">7. Трансграничная передача</h2>
            <p>
              В зависимости от выбранных интеграций и инфраструктуры отдельные данные могут
              обрабатываться с использованием сервисов, серверы которых находятся за пределами
              Российской Федерации (в частности, при обращении к внешним AI API и/или Stepik). Такая
              передача осуществляется только в объёме, необходимом для предоставления
              функциональности, запрошенной пользователем, и при наличии согласия / иного законного
              основания.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">8. Сроки хранения</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                данные учётной записи и связанные материалы курса — в течение срока использования
                Сервиса и до удаления аккаунта (либо до истечения разумного срока после запроса на
                удаление);
              </li>
              <li>токены и ключи Stepik — пока интеграция подключена либо до их отзыва пользователем;</li>
              <li>
                технические журналы — в течение срока, необходимого для обеспечения безопасности и
                диагностики, как правило не дольше 12 месяцев, если иной срок не требуется по закону.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">9. Меры защиты</h2>
            <p>Оператор принимает разумные организационные и технические меры, включая:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>хранение паролей в хешированном виде;</li>
              <li>использование защищённого соединения (HTTPS);</li>
              <li>ограничение доступа к инфраструктуре и базам данных;</li>
              <li>неразглашение секретов интеграции Stepik третьим лицам вне целей Сервиса.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">10. Права пользователя</h2>
            <p>Пользователь вправе:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>получить сведения об обработке своих персональных данных;</li>
              <li>требовать уточнения, блокирования или удаления данных;</li>
              <li>отозвать согласие на обработку персональных данных;</li>
              <li>потребовать удаления учётной записи.</li>
            </ul>
            <p>
              Для реализации прав направьте запрос на{' '}
              <a
                href="mailto:systemalert34@gmail.com"
                className="text-primary-400 hover:text-primary-300"
              >
                systemalert34@gmail.com
              </a>
              . Оператор рассмотрит обращение в разумный срок, как правило не позднее 30 дней.
            </p>
            <p>
              Отзыв согласия и удаление аккаунта могут сделать невозможным дальнейшее использование
              Сервиса.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">11. Cookies и технические данные</h2>
            <p>
              Сервис использует технические средства, необходимые для авторизации и поддержания
              сессии (в том числе токены в локальном хранилище браузера). Отдельная рекламная
              аналитика и маркетинговые трекеры на момент публикации настоящей Политики не
              применяются. При их появлении Политика будет обновлена.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">
              12. Stepik, контент курса и AI
            </h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                права на учебные материалы курса остаются у пользователя (и/или правообладателей);
              </li>
              <li>
                Оператор не использует контент курса пользователя для самостоятельной публикации
                или продажи от своего имени;
              </li>
              <li>
                изменения на стороне Stepik (создание, обновление, удаление модулей, уроков, шагов
                или курса) выполняются только в результате явных действий пользователя в Сервисе;
              </li>
              <li>
                для тестирования рекомендуется использовать копию курса или отдельный тестовый
                курс, а не единственный боевой курс без резервной копии;
              </li>
              <li>
                при работе с AI-функциями фрагменты курса и текст запросов могут передаваться
                провайдеру AI для выполнения задачи пользователя.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">13. Изменение Политики</h2>
            <p>
              Оператор вправе обновлять настоящую Политику. Актуальная версия всегда доступна на
              странице{' '}
              <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
                /privacy
              </Link>
              . Продолжение использования Сервиса после публикации новой редакции означает
              согласие с обновлёнными условиями в части, не требующей отдельного согласия по
              закону.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-dark-100">14. Контакты</h2>
            <p>
              По вопросам обработки персональных данных:{' '}
              <a
                href="mailto:systemalert34@gmail.com"
                className="text-primary-400 hover:text-primary-300"
              >
                systemalert34@gmail.com
              </a>
            </p>
            <p className="text-dark-100">Тимонин Андрей Владимирович</p>
          </section>
        </article>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-dark-400">
          <Link to="/" className="hover:text-dark-200">
            На главную
          </Link>
          <Link to="/register" className="hover:text-dark-200">
            Регистрация
          </Link>
          <Link to="/login" className="hover:text-dark-200">
            Вход
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
