/** Public site origin for absolute OG/canonical URLs. */
export const SITE_ORIGIN = 'https://easy-course.ru';

export const SITE_NAME = 'EasyCourse';

export const SITE_TITLE = 'EasyCourse — редактор курсов Stepik с AI';

export const SITE_DESCRIPTION =
  'EasyCourse — редактор онлайн-курсов для авторов Stepik. Собирайте модули, уроки и шаги, генерируйте контент с помощью ИИ и синхронизируйте курс с платформой Stepik.';

export const SITE_OG_IMAGE_PATH = '/og-image.png';

export const SITE_OG_IMAGE_URL = `${SITE_ORIGIN}${SITE_OG_IMAGE_PATH}`;

export const SITE_CANONICAL_URL = `${SITE_ORIGIN}/`;

/** Extra landing copy for search (keywords in natural prose). */
export const LANDING_SEO_PARAGRAPHS = [
  'EasyCourse помогает авторам Stepik ускорить создание курсов: структура из модулей, уроков и шагов собирается в одном редакторе, а AI-агент предлагает план и наполняет курс по вашему описанию.',
  'Генерация заданий и текстовых шагов, синхронизация со Stepik и привычные типы контента платформы — чтобы меньше ручной рутины и быстрее выйти к публикации курса.',
] as const;

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export const LANDING_FAQ: LandingFaqItem[] = [
  {
    question: 'Что такое EasyCourse?',
    answer:
      'EasyCourse — веб-редактор онлайн-курсов для авторов Stepik. В нём можно собрать структуру курса, наполнить уроки шагами, сгенерировать контент с помощью ИИ и выгрузить результат на Stepik.',
  },
  {
    question: 'Чем EasyCourse отличается от ручной сборки на Stepik?',
    answer:
      'На Stepik вы работаете с платформой напрямую. В EasyCourse удобнее держать черновик курса целиком: модули и уроки, AI-агент для планирования и генерации, пакетная генерация шагов и синхронизация, когда контент готов.',
  },
  {
    question: 'Что умеет AI-агент курса?',
    answer:
      'Вы описываете задачу в диалоге — агент предлагает план модулей, уроков и шагов, показывает его на подтверждение и после согласия создаёт сущности в вашем курсе.',
  },
  {
    question: 'Можно ли генерировать отдельные задания без агента?',
    answer:
      'Да. Раздел генерации шагов создаёт тексты и задания разных типов Stepik (тесты, код, математика и другие) для выбранного урока, в том числе пакетно.',
  },
  {
    question: 'Как курс попадает на Stepik?',
    answer:
      'Подключите аккаунт Stepik в настройках и синхронизируйте курс из редактора. Можно публиковать и обновлять уже выгруженный курс, не собирая всё заново вручную на платформе.',
  },
];
