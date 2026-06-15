export interface PromptSuggestion {
  label: string;
  prompt: string;
}

export const CHAT_PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    label: 'Идеи для курса',
    prompt: 'Предложи структуру курса по основам Python для начинающих: модули, уроки и типы заданий.',
  },
  {
    label: 'Объяснить тему',
    prompt: 'Объясни простыми словами, что такое рекурсия, с примером на Python.',
  },
  {
    label: 'Проверить задание',
    prompt: 'Проверь формулировку тестового задания: «Что выведет print(2 ** 3)?» — что улучшить?',
  },
];

export const GENERATE_PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    label: 'Тест Python',
    prompt: 'Создай тест про списки в Python: 4 варианта ответа, одна правильная, средняя сложность.',
  },
  {
    label: 'Теория HTTP',
    prompt: 'Напиши теоретический текст про HTTP-методы GET и POST с короткими примерами.',
  },
  {
    label: 'Задача code',
    prompt: 'Создай задачу по программированию: найти сумму элементов массива на Python, с 2 тестами.',
  },
];

export const BATCH_PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    label: 'Типовой урок',
    prompt: 'Создай урок про массивы в Java: 2 текста, 2 choice, 1 code',
  },
  {
    label: 'Только практика',
    prompt: '5 заданий choice по основам SQL: SELECT, WHERE, JOIN',
  },
  {
    label: 'Введение в тему',
    prompt: 'Урок-введение в Git: 3 текстовых шага с примерами команд',
  },
];
