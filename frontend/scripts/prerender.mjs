import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');

const SITE_ORIGIN = 'https://easy-course.ru';
const SITE_NAME = 'EasyCourse';
const OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

const LANDING = {
  path: '/',
  file: 'index.html',
  title: 'EasyCourse — редактор курсов Stepik с AI',
  description:
    'EasyCourse — редактор онлайн-курсов для авторов Stepik. Собирайте модули, уроки и шаги, генерируйте контент с помощью ИИ и синхронизируйте курс с платформой Stepik.',
  robots: 'index, follow',
  body: `
<header>
  <p>${SITE_NAME}</p>
  <nav>
    <a href="/login">Войти</a>
    <a href="/register">Регистрация</a>
  </nav>
</header>
<main>
  <h1>EasyCourse</h1>
  <p>Создавайте и публикуйте курсы на Stepik быстро и удобно</p>
  <p>EasyCourse — редактор онлайн-курсов для авторов Stepik. Собирайте модули, уроки и шаги в одном месте, редактируйте контент, генерируйте задания с помощью ИИ и синхронизируйте результат с платформой Stepik.</p>
  <p>EasyCourse помогает авторам Stepik ускорить создание курсов: структура из модулей, уроков и шагов собирается в одном редакторе, а AI-агент предлагает план и наполняет курс по вашему описанию.</p>
  <p>Генерация заданий и текстовых шагов, синхронизация со Stepik и привычные типы контента платформы — чтобы меньше ручной рутины и быстрее выйти к публикации курса.</p>
  <h2>Что можно делать</h2>
  <ul>
    <li><strong>Структура курса</strong> — модули, уроки и шаги в удобном редакторе с drag-and-drop.</li>
    <li><strong>AI-агент курса</strong> — опишите задачу в диалоге: агент спланирует модули, уроки и шаги и создаст их в курсе.</li>
    <li><strong>Генерация шагов</strong> — тексты и задания для отдельных шагов с помощью нейросетей.</li>
    <li><strong>Синхронизация Stepik</strong> — публикуйте и обновляйте курс на Stepik прямо из редактора.</li>
    <li><strong>Все типы шагов</strong> — текст, тесты, код, математика, сопоставление и другие форматы Stepik.</li>
  </ul>
  <h2>Частые вопросы</h2>
  <section>
    <h3>Что такое EasyCourse?</h3>
    <p>EasyCourse — веб-редактор онлайн-курсов для авторов Stepik. В нём можно собрать структуру курса, наполнить уроки шагами, сгенерировать контент с помощью ИИ и выгрузить результат на Stepik.</p>
    <h3>Чем EasyCourse отличается от ручной сборки на Stepik?</h3>
    <p>На Stepik вы работаете с платформой напрямую. В EasyCourse удобнее держать черновик курса целиком: модули и уроки, AI-агент для планирования и генерации, пакетная генерация шагов и синхронизация, когда контент готов.</p>
    <h3>Что умеет AI-агент курса?</h3>
    <p>Вы описываете задачу в диалоге — агент предлагает план модулей, уроков и шагов, показывает его на подтверждение и после согласия создаёт сущности в вашем курсе.</p>
    <h3>Можно ли генерировать отдельные задания без агента?</h3>
    <p>Да. Раздел генерации шагов создаёт тексты и задания разных типов Stepik (тесты, код, математика и другие) для выбранного урока, в том числе пакетно.</p>
    <h3>Как курс попадает на Stepik?</h3>
    <p>Создайте OAuth2-приложение на stepik.org/oauth2/applications (тип Confidential), скопируйте Client ID и Client Secret и вставьте их в настройках EasyCourse. После этого в редакторе можно синхронизировать курс: модули, уроки и шаги уйдут на ваш аккаунт Stepik. Уже выгруженный курс можно обновлять теми же ключами, не собирая всё заново вручную на платформе.</p>
  </section>
  <p><a href="/register">Зарегистрироваться</a> · <a href="/login">Войти</a></p>
</main>
`.trim(),
  jsonLd: `
    <script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Что такое EasyCourse?","acceptedAnswer":{"@type":"Answer","text":"EasyCourse — веб-редактор онлайн-курсов для авторов Stepik. В нём можно собрать структуру курса, наполнить уроки шагами, сгенерировать контент с помощью ИИ и выгрузить результат на Stepik."}},{"@type":"Question","name":"Чем EasyCourse отличается от ручной сборки на Stepik?","acceptedAnswer":{"@type":"Answer","text":"На Stepik вы работаете с платформой напрямую. В EasyCourse удобнее держать черновик курса целиком: модули и уроки, AI-агент для планирования и генерации, пакетная генерация шагов и синхронизация, когда контент готов."}},{"@type":"Question","name":"Что умеет AI-агент курса?","acceptedAnswer":{"@type":"Answer","text":"Вы описываете задачу в диалоге — агент предлагает план модулей, уроков и шагов, показывает его на подтверждение и после согласия создаёт сущности в вашем курсе."}},{"@type":"Question","name":"Можно ли генерировать отдельные задания без агента?","acceptedAnswer":{"@type":"Answer","text":"Да. Раздел генерации шагов создаёт тексты и задания разных типов Stepik (тесты, код, математика и другие) для выбранного урока, в том числе пакетно."}},{"@type":"Question","name":"Как курс попадает на Stepik?","acceptedAnswer":{"@type":"Answer","text":"Создайте OAuth2-приложение на stepik.org/oauth2/applications (тип Confidential), скопируйте Client ID и Client Secret и вставьте их в настройках EasyCourse. После этого в редакторе можно синхронизировать курс: модули, уроки и шаги уйдут на ваш аккаунт Stepik. Уже выгруженный курс можно обновлять теми же ключами, не собирая всё заново вручную на платформе."}}]}
    </script>
    <script type="application/ld+json">
{"@context":"https://schema.org","@type":"SoftwareApplication","name":"EasyCourse","applicationCategory":"EducationalApplication","operatingSystem":"Web","url":"https://easy-course.ru","description":"EasyCourse — редактор онлайн-курсов для авторов Stepik. Собирайте модули, уроки и шаги, генерируйте контент с помощью ИИ и синхронизируйте курс с платформой Stepik."}
    </script>`,
};

const LOGIN = {
  path: '/login',
  file: 'login/index.html',
  title: 'Вход — EasyCourse',
  description: 'Войдите в EasyCourse, чтобы редактировать курсы Stepik и работать с AI-агентом.',
  robots: 'noindex, nofollow',
  body: `
<main>
  <h1>Вход в EasyCourse</h1>
  <p>Войдите в аккаунт, чтобы продолжить работу с курсами Stepik.</p>
  <p><a href="/register">Нет аккаунта? Зарегистрироваться</a> · <a href="/">На главную</a></p>
</main>
`.trim(),
};

const REGISTER = {
  path: '/register',
  file: 'register/index.html',
  title: 'Регистрация — EasyCourse',
  description: 'Создайте аккаунт EasyCourse и начните собирать курсы для Stepik с помощью AI.',
  robots: 'noindex, nofollow',
  body: `
<main>
  <h1>Регистрация в EasyCourse</h1>
  <p>Создайте аккаунт и начните собирать курсы для Stepik с помощью AI.</p>
  <p><a href="/login">Уже есть аккаунт? Войти</a> · <a href="/">На главную</a></p>
</main>
`.trim(),
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceMetaByName(html, name, content) {
  const re = new RegExp(
    `<meta\\s+name="${escapeRegExp(name)}"\\s+content="[^"]*"\\s*/?>`,
    'i',
  );
  const tag = `<meta name="${name}" content="${content}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function replaceMetaByProperty(html, property, content) {
  const re = new RegExp(
    `<meta\\s+property="${escapeRegExp(property)}"\\s+content="[^"]*"\\s*/?>`,
    'i',
  );
  const tag = `<meta property="${property}" content="${content}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
}

function replaceCanonical(html, href) {
  const re = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  const tag = `<link rel="canonical" href="${href}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function injectRoot(html, body) {
  const rootRe = /<div id="root"><\/div>/i;
  if (!rootRe.test(html)) {
    throw new Error('dist/index.html: #root placeholder not found');
  }
  return html.replace(rootRe, `<div id="root">\n${body}\n    </div>`);
}

function applyPageMeta(html, page) {
  const url = `${SITE_ORIGIN}${page.path === '/' ? '/' : page.path}`;
  let next = html;
  next = replaceTitle(next, page.title);
  next = replaceMetaByName(next, 'description', page.description);
  next = replaceMetaByName(next, 'robots', page.robots);
  next = replaceCanonical(next, url);
  next = replaceMetaByProperty(next, 'og:url', url);
  next = replaceMetaByProperty(next, 'og:title', page.title);
  next = replaceMetaByProperty(next, 'og:description', page.description);
  next = replaceMetaByProperty(next, 'og:image', OG_IMAGE);
  next = replaceMetaByName(next, 'twitter:title', page.title);
  next = replaceMetaByName(next, 'twitter:description', page.description);
  next = replaceMetaByName(next, 'twitter:image', OG_IMAGE);
  return next;
}

function writePage(templateHtml, page) {
  let html = injectRoot(templateHtml, page.body);
  html = applyPageMeta(html, page);
  if (page.jsonLd) {
    html = html.replace('</head>', `${page.jsonLd}\n  </head>`);
  }
  const outPath = join(distDir, page.file);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  console.log(`[prerender] ${page.path} → ${page.file}`);
}

const template = readFileSync(indexPath, 'utf8');
if (!template.includes('id="root"')) {
  throw new Error('Run vite build before prerender: dist/index.html is missing #root');
}

for (const page of [LANDING, LOGIN, REGISTER]) {
  writePage(template, page);
}

console.log('[prerender] done');
