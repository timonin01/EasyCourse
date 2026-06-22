import type { StepType } from '../../types';

export const STEP_TYPE_OPTIONS = [
  { value: 'text', label: '📝 Текстовый контент (урок/задача)' },
  { value: 'choice', label: '✅ Выбор ответа' },
  { value: 'matching', label: '🔗 Сопоставление' },
  { value: 'sorting', label: '📊 Сортировка' },
  { value: 'fill-blanks', label: '✏️ Заполнить пропуски' },
  { value: 'string', label: '🔤 Ввод строки' },
  { value: 'number', label: '🔢 Ввод числа' },
  { value: 'free-answer', label: '💬 Свободный ответ' },
  { value: 'math', label: '🔢 Математическая задача' },
  { value: 'random-tasks', label: '🎲 Случайные задачи' },
  { value: 'table', label: '📋 Таблица' },
  { value: 'code', label: '💻 Задача по программированию' },
] as const;

export const STEP_TYPE_MAP: Record<string, StepType> = {
  text: 'TEXT',
  choice: 'CHOICE',
  matching: 'MATCHING',
  sorting: 'SORTING',
  'fill-blanks': 'FILL_BLANK',
  string: 'STRING',
  number: 'NUMBER',
  'free-answer': 'FREE_ANSWER',
  math: 'MATH',
  'random-tasks': 'RANDOM_TASKS',
  table: 'TABLE',
  code: 'CODE',
};

export const MODE_SUBTITLES: Record<'chat' | 'generate' | 'batch', string> = {
  chat: 'Свободный чат с ИИ',
  generate: 'Генерация контента для курсов',
  batch: 'Пакетная генерация нескольких шагов',
};
