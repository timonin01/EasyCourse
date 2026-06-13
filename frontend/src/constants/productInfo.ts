import { BookOpen, Layers, RefreshCw, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const PRODUCT_TAGLINE = 'Создавайте и публикуйте курсы на Stepik — быстро и удобно';

export const PRODUCT_DESCRIPTION =
  'EasyCourse — редактор онлайн-курсов для авторов Stepik. Собирайте модули, уроки и шаги в одном месте, редактируйте контент, генерируйте задания с помощью ИИ и синхронизируйте результат с платформой Stepik.';

export const PRODUCT_FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: BookOpen,
    title: 'Структура курса',
    description: 'Модули, уроки и шаги — всё в удобном редакторе с drag-and-drop.',
  },
  {
    icon: Sparkles,
    title: 'AI-генератор',
    description: 'Создавайте текстовые блоки и задания разных типов с помощью нейросетей.',
  },
  {
    icon: RefreshCw,
    title: 'Синхронизация Stepik',
    description: 'Публикуйте и обновляйте курс на Stepik прямо из редактора.',
  },
  {
    icon: Layers,
    title: 'Все типы шагов',
    description: 'Текст, тесты, код, математика, сопоставление и другие форматы Stepik.',
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
    description: 'Добавьте модули, уроки и шаги вручную или с помощью AI-генератора.',
  },
  {
    step: 3,
    title: 'Синхронизируйте со Stepik',
    description: 'Подключите Stepik в настройках и опубликуйте курс одним нажатием.',
  },
];
