import { BookOpen, Bot, Layers, RefreshCw, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const PRODUCT_TAGLINE = 'Создавайте и публикуйте курсы на Stepik быстро и удобно';

export const PRODUCT_DESCRIPTION =
  'EasyCourse — редактор онлайн-курсов для авторов Stepik. Собирайте модули, уроки и шаги в одном месте, редактируйте контент, генерируйте задания с помощью ИИ и синхронизируйте результат с платформой Stepik.';

export type ProductFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Куда вести гостя по кнопке «Попробовать» (без аккаунта — на регистрацию). */
  tryPath: string;
};

export const PRODUCT_FEATURES: ProductFeature[] = [
  {
    icon: BookOpen,
    title: 'Структура курса',
    description: 'Модули, уроки и шаги — всё в удобном редакторе с drag-and-drop.',
    tryPath: '/register',
  },
  {
    icon: Bot,
    title: 'AI-агент курса',
    description:
      'Опишите задачу в диалоге — агент спланирует модули, уроки и шаги, покажет план на подтверждение и сам создаст их в курсе.',
    tryPath: '/register',
  },
  {
    icon: Sparkles,
    title: 'Генерация шагов',
    description: 'Создавайте тексты и задания для отдельных шагов с помощью нейросетей.',
    tryPath: '/register',
  },
  {
    icon: RefreshCw,
    title: 'Синхронизация Stepik',
    description: 'Публикуйте и обновляйте курс на Stepik прямо из редактора.',
    tryPath: '/register',
  },
  {
    icon: Layers,
    title: 'Все типы шагов',
    description: 'Текст, тесты, код, математика, сопоставление и другие форматы Stepik.',
    tryPath: '/register',
  },
];

export const ONBOARDING_STEPS: { step: number; title: string; description: string }[] = [
  {
    step: 1,
    title: 'Создайте курс',
    description: 'Задайте название и описание — это основа вашего будущего курса на Stepik.',
  },
  {
    step: 2,
    title: 'Наполните уроками и шагами',
    description: 'Добавьте модули, уроки и шаги вручную или через генерацию шагов.',
  },
  {
    step: 3,
    title: 'Синхронизируйте со Stepik',
    description: 'Подключите Stepik в настройках и опубликуйте курс одним нажатием.',
  },
];
