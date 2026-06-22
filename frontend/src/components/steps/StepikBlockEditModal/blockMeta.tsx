import {
  FileText,
  ListChecks,
  Link2,
  ArrowUpDown,
  TextCursorInput,
  Type,
  Hash,
  MessageSquareText,
  Calculator,
  Shuffle,
  Table2,
  Code,
} from 'lucide-react';

export const BLOCK_META: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
  text: { title: 'Текстовый блок', subtitle: 'Информационный блок с текстом', icon: <FileText className="w-5 h-5" /> },
  choice: { title: 'Выбор ответа', subtitle: 'Вопрос с вариантами ответов', icon: <ListChecks className="w-5 h-5" /> },
  matching: { title: 'Сопоставление', subtitle: 'Создайте пары для сопоставления', icon: <Link2 className="w-5 h-5" /> },
  sorting: { title: 'Сортировка', subtitle: 'Расположите элементы в правильном порядке', icon: <ArrowUpDown className="w-5 h-5" /> },
  'fill-blanks': { title: 'Заполнить пропуски', subtitle: 'Текст с пропусками для заполнения', icon: <TextCursorInput className="w-5 h-5" /> },
  string: { title: 'Строковый ответ', subtitle: 'Задание с вводом текстовой строки', icon: <Type className="w-5 h-5" /> },
  number: { title: 'Числовой ответ', subtitle: 'Задание с вводом числа', icon: <Hash className="w-5 h-5" /> },
  'free-answer': { title: 'Свободный ответ', subtitle: 'Задание с развёрнутым текстовым ответом', icon: <MessageSquareText className="w-5 h-5" /> },
  math: { title: 'Математическая задача', subtitle: 'Задание с числовым или формульным ответом', icon: <Calculator className="w-5 h-5" /> },
  'random-tasks': { title: 'Случайные задачи', subtitle: 'Генерация задач с динамическими параметрами', icon: <Shuffle className="w-5 h-5" /> },
  table: { title: 'Таблица выбора', subtitle: 'Таблица с правильными ответами', icon: <Table2 className="w-5 h-5" /> },
  code: { title: 'Задача по программированию', subtitle: 'Задание с проверкой кода', icon: <Code className="w-5 h-5" /> },
};

export const KNOWN_BLOCK_NAMES = Object.keys(BLOCK_META);
