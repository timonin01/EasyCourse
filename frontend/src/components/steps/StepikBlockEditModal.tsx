import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  MessageCircle,
  ListChecks,
  ArrowLeftRight,
  Link2,
  Calculator,
  Hash,
  ArrowUpDown,
  GripVertical,
  Type,
  Regex,
  Code,
  Settings2,
  Paperclip,
  UserCheck,
  MessageSquareText,
  TextCursorInput,
  Table2,
  Columns,
  Rows,
  Shuffle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Modal,
  Button,
  Input,
  Textarea,
  HtmlTextField,
  HtmlInlinePreview,
  FormSection,
  OptionCard,
  AddButton,
  Toggle,
  Checkbox,
  SortableList,
} from '../ui';
import type { StepikBlockRequest } from '../../types';

type ChoiceOptionEdit = { text: string; is_correct: boolean; feedback: string };
type MatchingPairEdit = { first: string; second: string };
type NumberOptionEdit = { answer: string; maxError: string };
type SortingOptionEdit = { id: number; text: string };
type FillBlanksComponentEdit = {
  type: 'text' | 'blank';
  text: string;
  options: { text: string; is_correct: boolean }[];
  inputType?: 'input' | 'select';
};
type TableRowEdit = { name: string; columns: boolean[] };

interface StepikBlockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: StepikBlockRequest | null;
  onSave: (block: StepikBlockRequest) => void;
  title?: string;
}

const BLOCK_META: Record<string, { title: string; subtitle: string; icon: React.ReactNode }> = {
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function makeMatchingPairsUnique(pairs: MatchingPairEdit[]): MatchingPairEdit[] {
  const usedFirst = new Set<string>();
  const usedSecond = new Set<string>();
  return pairs.map((p) => {
    const firstBase = (p.first ?? '').trim();
    const secondBase = (p.second ?? '').trim();
    let first = firstBase;
    let key = first.toLowerCase();
    let n = 2;
    while (usedFirst.has(key)) {
      first = firstBase + ` (${n})`;
      key = first.toLowerCase();
      n++;
    }
    usedFirst.add(key);
    let second = secondBase;
    key = second.toLowerCase();
    n = 2;
    while (usedSecond.has(key)) {
      second = secondBase + ` (${n})`;
      key = second.toLowerCase();
      n++;
    }
    usedSecond.add(key);
    return { first, second };
  });
}

export function StepikBlockEditModal({
  isOpen,
  onClose,
  block,
  onSave,
  title,
}: StepikBlockEditModalProps) {
  const blockName = block?.name || 'text';
  const meta = BLOCK_META[blockName] ?? {
    title: blockName,
    subtitle: 'Редактирование шага',
    icon: <FileText className="w-5 h-5" />,
  };

  // Общие поля
  const [text, setText] = useState('');
  const [feedbackCorrect, setFeedbackCorrect] = useState('');
  const [feedbackWrong, setFeedbackWrong] = useState('');

  // choice
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOptionEdit[]>([]);
  const [choiceSourceRest, setChoiceSourceRest] = useState<Record<string, unknown>>({});
  // matching
  const [matchingPairs, setMatchingPairs] = useState<MatchingPairEdit[]>([]);
  const [matchingSourceRest, setMatchingSourceRest] = useState<Record<string, unknown>>({});
  // code
  const [codeData, setCodeData] = useState({
    templates_data: '::java21',
    code: '',
    test_cases: [['', '']] as [string, string][],
    execution_time_limit: 5,
    execution_memory_limit: 256,
  });
  // free-answer
  const [freeAnswer, setFreeAnswer] = useState({
    is_attachments_enabled: false,
    is_html_enabled: false,
    manual_scoring: false,
  });
  // math
  const [mathData, setMathData] = useState({ answer: '', maxError: '1e-06' });
  const [mathNtRest, setMathNtRest] = useState<Record<string, unknown>>({});
  // number
  const [numberOptions, setNumberOptions] = useState<NumberOptionEdit[]>([]);
  const [numberSourceRest, setNumberSourceRest] = useState<Record<string, unknown>>({});
  // sorting
  const [sortingOptions, setSortingOptions] = useState<SortingOptionEdit[]>([]);
  const [sortingSourceRest, setSortingSourceRest] = useState<Record<string, unknown>>({});
  // string
  const [stringData, setStringData] = useState({
    pattern: '',
    use_re: false,
    match_substring: false,
    case_sensitive: false,
    code: '',
  });
  // fill-blanks
  const [fillBlanks, setFillBlanks] = useState<{
    components: FillBlanksComponentEdit[];
    isCaseSensitive: boolean;
    isDetailedFeedback: boolean;
    isPartiallyCorrect: boolean;
  }>({ components: [], isCaseSensitive: false, isDetailedFeedback: false, isPartiallyCorrect: false });
  // table
  const [tableData, setTableData] = useState<{ columnNames: string[]; rows: TableRowEdit[] }>({
    columnNames: [],
    rows: [],
  });
  const [tableOptions, setTableOptions] = useState<Record<string, unknown>>({});
  // random-tasks
  const [randomTasks, setRandomTasks] = useState({ task: '', solve: '', maxError: '' });
  // generic JSON fallback
  const [sourceJson, setSourceJson] = useState('');

  useEffect(() => {
    if (!isOpen || !block) return;

    setText(block.text || '');
    setFeedbackCorrect(block.feedback_correct || '');
    setFeedbackWrong(block.feedback_wrong || '');

    const src = asRecord(block.source);

    if (blockName === 'choice') {
      const opts = Array.isArray(src.options) ? src.options : [];
      setChoiceOptions(
        opts.length > 0
          ? opts.map((o) => {
              const x = o as { text?: string; is_correct?: boolean; feedback?: string };
              return {
                text: typeof x.text === 'string' ? x.text : '',
                is_correct: !!x.is_correct,
                feedback: typeof x.feedback === 'string' ? x.feedback : '',
              };
            })
          : [{ text: '', is_correct: false, feedback: '' }]
      );
      const { options: _o, ...rest } = src;
      setChoiceSourceRest(rest);
    } else if (blockName === 'matching') {
      let rawPairs = src.pairs as unknown;
      if (!rawPairs && Array.isArray(src.options)) {
        rawPairs = (src.options as { text?: string; match?: string }[]).map((o) => ({
          first: o.text ?? '',
          second: o.match ?? '',
        }));
      }
      setMatchingPairs(
        Array.isArray(rawPairs) && rawPairs.length > 0
          ? rawPairs.map((p) => {
              const x = p as { first?: string; second?: string };
              return {
                first: typeof x.first === 'string' ? x.first : '',
                second: typeof x.second === 'string' ? x.second : '',
              };
            })
          : [{ first: '', second: '' }]
      );
      const { pairs: _p, options: _o, ...rest } = src;
      setMatchingSourceRest(rest);
    } else if (blockName === 'code') {
      const testCases = Array.isArray(src.test_cases) ? src.test_cases : [];
      setCodeData({
        templates_data: typeof src.templates_data === 'string' ? src.templates_data : '::java21',
        code: typeof src.code === 'string' ? src.code : '',
        test_cases:
          testCases.length > 0
            ? testCases.map((p) => {
                const pair = p as unknown[];
                return Array.isArray(pair) && pair.length >= 2
                  ? ([String(pair[0]), String(pair[1])] as [string, string])
                  : (['', ''] as [string, string]);
              })
            : [['', '']],
        execution_time_limit: typeof src.execution_time_limit === 'number' ? src.execution_time_limit : 5,
        execution_memory_limit: typeof src.execution_memory_limit === 'number' ? src.execution_memory_limit : 256,
      });
    } else if (blockName === 'free-answer') {
      setFreeAnswer({
        is_attachments_enabled: !!src.is_attachments_enabled,
        is_html_enabled: !!src.is_html_enabled,
        manual_scoring: !!src.manual_scoring,
      });
    } else if (blockName === 'math') {
      const nt = asRecord(src.numerical_test);
      setMathData({
        answer: typeof src.answer === 'string' ? src.answer : '',
        maxError: typeof nt.max_error === 'string' ? nt.max_error : '1e-06',
      });
      setMathNtRest(nt);
    } else if (blockName === 'number') {
      const opts = Array.isArray(src.options) ? src.options : [];
      setNumberOptions(
        opts.length > 0
          ? opts.map((o) => {
              const x = o as { answer?: string; max_error?: string };
              return {
                answer: typeof x.answer === 'string' ? x.answer : '',
                maxError: typeof x.max_error === 'string' ? x.max_error : '',
              };
            })
          : [{ answer: '', maxError: '' }]
      );
      const { options: _o, ...rest } = src;
      setNumberSourceRest(rest);
    } else if (blockName === 'sorting') {
      const opts = Array.isArray(src.options) ? src.options : [];
      setSortingOptions(
        opts.length > 0
          ? opts.map((o, index) => {
              const x = o as { text?: string };
              return { id: index + 1, text: typeof x.text === 'string' ? x.text : '' };
            })
          : [{ id: 1, text: '' }]
      );
      const { options: _o, ...rest } = src;
      setSortingSourceRest(rest);
    } else if (blockName === 'string') {
      setStringData({
        pattern: typeof src.pattern === 'string' ? src.pattern : '',
        use_re: !!src.use_re,
        match_substring: !!src.match_substring,
        case_sensitive: !!src.case_sensitive,
        code: typeof src.code === 'string' ? src.code : '',
      });
    } else if (blockName === 'fill-blanks') {
      const comps = (Array.isArray(src.components) ? src.components : []) as {
        type?: string;
        text?: string;
        options?: { text?: string; is_correct?: boolean }[];
      }[];
      const components: FillBlanksComponentEdit[] = [];
      let i = 0;
      while (i < comps.length) {
        const c = comps[i];
        if (c.type === 'text') {
          if (i + 1 < comps.length) {
            const next = comps[i + 1];
            if (next.type === 'input' || next.type === 'select') {
              components.push({
                type: 'blank',
                text: typeof c.text === 'string' ? c.text : '',
                options: Array.isArray(next.options)
                  ? next.options.map((o) => ({ text: typeof o?.text === 'string' ? o.text : '', is_correct: !!o?.is_correct }))
                  : [],
                inputType: next.type === 'select' ? 'select' : 'input',
              });
              i += 2;
              continue;
            }
          }
          components.push({ type: 'text', text: typeof c.text === 'string' ? c.text : '', options: [] });
          i++;
        } else if (c.type === 'input' || c.type === 'select' || c.type === 'blank') {
          components.push({
            type: 'blank',
            text: typeof c.text === 'string' ? c.text : '',
            options: Array.isArray(c.options)
              ? c.options.map((o) => ({ text: typeof o?.text === 'string' ? o.text : '', is_correct: !!o?.is_correct }))
              : [],
            inputType: c.type === 'select' ? 'select' : 'input',
          });
          i++;
        } else {
          i++;
        }
      }
      if (components.length === 0) components.push({ type: 'text', text: '', options: [] });
      setFillBlanks({
        components,
        isCaseSensitive: !!src.is_case_sensitive,
        isDetailedFeedback: !!src.is_detailed_feedback,
        isPartiallyCorrect: !!src.is_partially_correct,
      });
    } else if (blockName === 'table') {
      const rows = (Array.isArray(src.rows) ? src.rows : []) as {
        name?: string;
        columns?: { choice?: boolean }[];
        cells?: { choice?: boolean }[];
      }[];
      const columns = (Array.isArray(src.columns) ? src.columns : []) as { name?: string }[];
      const columnNames = columns.length > 0 ? columns.map((c) => (typeof c.name === 'string' ? c.name : '')) : [''];
      let tableRows: TableRowEdit[];
      if (rows.length > 0) {
        tableRows = rows.map((r) => {
          const cols = r.columns ?? r.cells ?? [];
          const choiceBools = cols.map((c) => !!c?.choice);
          const padded = [...choiceBools];
          while (padded.length < columnNames.length) padded.push(false);
          return { name: typeof r.name === 'string' ? r.name : '', columns: padded.slice(0, columnNames.length) };
        });
      } else {
        tableRows = [{ name: '', columns: columnNames.map(() => false) }];
      }
      setTableData({ columnNames, rows: tableRows });
      setTableOptions(asRecord(src.options));
    } else if (blockName === 'random-tasks') {
      setRandomTasks({
        task: typeof src.task === 'string' ? src.task : '',
        solve: typeof src.solve === 'string' ? src.solve : '',
        maxError: typeof src.max_error === 'string' ? src.max_error : '',
      });
    } else {
      try {
        setSourceJson(block.source ? JSON.stringify(block.source, null, 2) : '{}');
      } catch {
        setSourceJson('{}');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, block, blockName]);

  const handleSave = () => {
    if (!block) return;
    const fc = feedbackCorrect.trim() || undefined;
    const fw = feedbackWrong.trim() || undefined;
    const base = { ...block, name: blockName, text, video: block.video ?? null, options: null as unknown, feedback_correct: fc, feedback_wrong: fw };
    let updated: StepikBlockRequest;

    if (blockName === 'choice') {
      const correctCount = choiceOptions.filter((o) => o.is_correct).length;
      updated = {
        ...base,
        source: {
          ...choiceSourceRest,
          sample_size: choiceOptions.length,
          is_multiple_choice: correctCount > 1,
          options: choiceOptions,
        },
      };
    } else if (blockName === 'matching') {
      updated = { ...base, source: { ...matchingSourceRest, pairs: makeMatchingPairsUnique(matchingPairs) } };
    } else if (blockName === 'code') {
      updated = {
        ...base,
        source: {
          code: codeData.code,
          templates_data: codeData.templates_data,
          test_cases: codeData.test_cases,
          execution_time_limit: codeData.execution_time_limit,
          execution_memory_limit: codeData.execution_memory_limit,
          samples_count: 1,
          are_all_tests_run: true,
          is_run_user_code_allowed: true,
          is_time_limit_scaled: true,
          is_memory_limit_scaled: true,
          manual_time_limits: [],
          manual_memory_limits: [],
          test_archive: [],
        },
      };
    } else if (blockName === 'free-answer') {
      updated = {
        ...base,
        source: {
          is_attachments_enabled: freeAnswer.is_attachments_enabled,
          is_html_enabled: freeAnswer.is_html_enabled,
          manual_scoring: freeAnswer.manual_scoring,
        },
      };
    } else if (blockName === 'math') {
      updated = {
        ...base,
        source: {
          answer: mathData.answer,
          numerical_test: {
            z_re_min: typeof mathNtRest.z_re_min === 'string' ? mathNtRest.z_re_min : '-1e308',
            z_re_max: typeof mathNtRest.z_re_max === 'string' ? mathNtRest.z_re_max : '1e308',
            z_im_min: typeof mathNtRest.z_im_min === 'string' ? mathNtRest.z_im_min : '-1e308',
            z_im_max: typeof mathNtRest.z_im_max === 'string' ? mathNtRest.z_im_max : '1e308',
            max_error: mathData.maxError,
            integer_only: typeof mathNtRest.integer_only === 'boolean' ? mathNtRest.integer_only : false,
          },
        },
      };
    } else if (blockName === 'number') {
      updated = {
        ...base,
        source: { ...numberSourceRest, options: numberOptions.map((o) => ({ answer: o.answer, max_error: o.maxError || '' })) },
      };
    } else if (blockName === 'sorting') {
      updated = { ...base, source: { ...sortingSourceRest, options: sortingOptions.map(({ text: t }) => ({ text: t })) } };
    } else if (blockName === 'string') {
      updated = {
        ...base,
        source: {
          pattern: stringData.pattern || undefined,
          use_re: stringData.use_re,
          match_substring: stringData.match_substring,
          case_sensitive: stringData.case_sensitive,
          code: stringData.code || undefined,
        },
      };
    } else if (blockName === 'fill-blanks') {
      const components: Array<{ type: 'text' | 'input' | 'select'; text: string; options: Array<{ text: string; is_correct: boolean }> }> = [];
      for (const c of fillBlanks.components) {
        if (c.type === 'text') {
          components.push({ type: 'text', text: c.text, options: [] });
        } else {
          const textBeforeBlank = c.text.trim();
          if (textBeforeBlank) components.push({ type: 'text', text: textBeforeBlank, options: [] });
          components.push({ type: c.inputType === 'select' ? 'select' : 'input', text: '', options: c.options });
        }
      }
      updated = {
        ...base,
        source: {
          components,
          is_case_sensitive: fillBlanks.isCaseSensitive,
          is_detailed_feedback: fillBlanks.isDetailedFeedback,
          is_partially_correct: fillBlanks.isPartiallyCorrect,
        },
      };
    } else if (blockName === 'table') {
      const columns = tableData.columnNames.map((name) => ({ name: typeof name === 'string' ? name : '' }));
      const rows = tableData.rows.map((r) => ({
        name: typeof r.name === 'string' ? r.name : '',
        columns: r.columns.map((choice) => ({ choice: !!choice })),
      }));
      const hasMultipleCorrect = tableData.rows.some((r) => r.columns.filter(Boolean).length > 1);
      const options: Record<string, unknown> = { ...tableOptions, sample_size: tableData.rows.length };
      if (hasMultipleCorrect) options.is_checkbox = true;
      updated = { ...base, source: { rows, columns, options, description: '' } };
    } else if (blockName === 'random-tasks') {
      updated = {
        ...base,
        source: { task: randomTasks.task, solve: randomTasks.solve, max_error: randomTasks.maxError || '' },
      };
    } else if (blockName === 'text') {
      const { source: _drop, ...rest } = base as Record<string, unknown>;
      updated = rest as StepikBlockRequest;
    } else {
      let parsedSource: unknown = block.source;
      if (sourceJson.trim()) {
        try {
          parsedSource = JSON.parse(sourceJson);
        } catch {
          toast.error('Некорректный JSON в поле source');
          return;
        }
      }
      updated = { ...base, source: parsedSource };
    }

    onSave(updated);
    onClose();
  };

  const feedbackSection = (
    <FormSection title="Обратная связь" icon={<MessageCircle className="w-4 h-4" />} variant="success">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Textarea label="При правильном ответе" value={feedbackCorrect} onChange={(e) => setFeedbackCorrect(e.target.value)} rows={2} placeholder="Отлично!..." />
        <Textarea label="При неправильном ответе" value={feedbackWrong} onChange={(e) => setFeedbackWrong(e.target.value)} rows={2} placeholder="Попробуйте ещё раз..." />
      </div>
    </FormSection>
  );

  const conditionSection = (rows = 4, placeholder = 'Введите условие задания...') => (
    <FormSection title="Условие задания" icon={<FileText className="w-4 h-4" />}>
      <HtmlTextField value={text} onChange={setText} rows={rows} placeholder={placeholder} />
    </FormSection>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || meta.title}
      subtitle={meta.subtitle}
      icon={meta.icon}
      size={blockName === 'table' ? 'xl' : 'lg'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button variant="success" onClick={handleSave}>
            <CheckCircle className="w-4 h-4" />
            Применить
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {blockName === 'text' && (
          <>
            <FormSection title="Содержимое" icon={<FileText className="w-4 h-4" />}>
              <HtmlTextField value={text} onChange={setText} rows={10} placeholder="Введите текст для отображения студенту..." />
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'choice' && (
          <>
            {conditionSection(4, 'Введите вопрос...')}
            <FormSection title="Варианты ответов" icon={<ListChecks className="w-4 h-4" />} description="Отметьте правильные варианты галочкой" variant="highlight">
              <div className="space-y-3">
                {choiceOptions.map((opt, i) => (
                  <OptionCard
                    key={i}
                    isCorrect={opt.is_correct}
                    showCorrectIndicator
                    onDelete={() => {
                      const next = choiceOptions.filter((_, j) => j !== i);
                      setChoiceOptions(next.length ? next : [{ text: '', is_correct: false, feedback: '' }]);
                    }}
                  >
                    <div className="flex gap-3 items-start">
                      <Checkbox
                        checked={opt.is_correct}
                        onChange={(v) => {
                          const next = [...choiceOptions];
                          next[i] = { ...next[i], is_correct: v };
                          setChoiceOptions(next);
                        }}
                        variant="success"
                      />
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={opt.text}
                          onChange={(e) => {
                            const next = [...choiceOptions];
                            next[i] = { ...next[i], text: e.target.value };
                            setChoiceOptions(next);
                          }}
                          rows={2}
                          placeholder="Введите текст варианта ответа..."
                          className={`w-full px-3 py-2 bg-dark-700/50 border rounded-lg text-sm placeholder-dark-500 resize-none focus:ring-2 focus:ring-primary-500/50 ${opt.is_correct ? 'border-emerald-500/40 text-emerald-100' : 'border-dark-600 text-dark-100'}`}
                        />
                        <HtmlInlinePreview html={opt.text} />
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-3.5 h-3.5 text-dark-500" />
                          <input
                            type="text"
                            value={opt.feedback}
                            onChange={(e) => {
                              const next = [...choiceOptions];
                              next[i] = { ...next[i], feedback: e.target.value };
                              setChoiceOptions(next);
                            }}
                            placeholder="Комментарий при выборе этого варианта (опционально)"
                            className="flex-1 px-3 py-1.5 bg-dark-700/30 border border-dark-600/50 rounded-lg text-dark-300 text-xs placeholder-dark-500 focus:ring-2 focus:ring-primary-500/50"
                          />
                        </div>
                      </div>
                    </div>
                  </OptionCard>
                ))}
              </div>
              <AddButton variant="dashed" fullWidth className="mt-3" onClick={() => setChoiceOptions([...choiceOptions, { text: '', is_correct: false, feedback: '' }])}>
                Добавить вариант ответа
              </AddButton>
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'matching' && (
          <>
            {conditionSection(4, 'Опишите задание для студента...')}
            <FormSection title="Пары для сопоставления" icon={<ArrowLeftRight className="w-4 h-4" />} description="Соедините элементы левого столбца с правым" variant="highlight">
              <div className="space-y-3">
                {matchingPairs.map((pair, i) => (
                  <OptionCard
                    key={i}
                    onDelete={() => {
                      const next = matchingPairs.filter((_, j) => j !== i);
                      setMatchingPairs(next.length ? next : [{ first: '', second: '' }]);
                    }}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <div className="text-xs text-dark-500 mb-1">Левая часть</div>
                        <input
                          type="text"
                          value={pair.first}
                          onChange={(e) => {
                            const next = [...matchingPairs];
                            next[i] = { ...next[i], first: e.target.value };
                            setMatchingPairs(next);
                          }}
                          placeholder="Элемент слева..."
                          className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                        />
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <div className="w-8 h-px bg-gradient-to-r from-primary-500/50 to-emerald-500/50" />
                        <ArrowLeftRight className="w-4 h-4 text-primary-400" />
                        <div className="w-8 h-px bg-gradient-to-r from-primary-500/50 to-emerald-500/50" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-dark-500 mb-1">Правая часть</div>
                        <input
                          type="text"
                          value={pair.second}
                          onChange={(e) => {
                            const next = [...matchingPairs];
                            next[i] = { ...next[i], second: e.target.value };
                            setMatchingPairs(next);
                          }}
                          placeholder="Соответствующий элемент..."
                          className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50"
                        />
                      </div>
                    </div>
                  </OptionCard>
                ))}
              </div>
              <AddButton variant="dashed" fullWidth className="mt-3" icon={<Link2 className="w-4 h-4" />} onClick={() => setMatchingPairs([...matchingPairs, { first: '', second: '' }])}>
                Добавить пару
              </AddButton>
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'code' && (
          <>
            <FormSection title="Условие задачи" icon={<FileText className="w-4 h-4" />}>
              <HtmlTextField value={text} onChange={setText} rows={4} placeholder="Опишите, что должен сделать студент..." />
            </FormSection>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Язык программирования</label>
              <select
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-dark-100"
                value={codeData.templates_data}
                onChange={(e) => setCodeData((p) => ({ ...p, templates_data: e.target.value }))}
              >
                <option value="::python3">Python 3</option>
                <option value="::java21">Java 21</option>
                <option value="::java17">Java 17</option>
                <option value="::java11">Java 11</option>
                <option value="::go">Go</option>
                <option value="::cpp">C++</option>
                <option value="::c">C</option>
                <option value="::csharp">C#</option>
                <option value="::kotlin">Kotlin</option>
                <option value="::rust">Rust</option>
                <option value="::javascript">JavaScript</option>
                <option value="::ruby">Ruby</option>
                <option value="::scala">Scala</option>
                <option value="::haskell">Haskell</option>
                <option value="::pascal">Pascal</option>
                <option value="::r">R</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Код (шаблон или чекер)</label>
              <textarea
                value={codeData.code}
                onChange={(e) => setCodeData((p) => ({ ...p, code: e.target.value }))}
                rows={8}
                placeholder="Вставьте код шаблона или чекера..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Тестовые случаи (ввод → ожидаемый вывод)</label>
              <div className="space-y-2">
                {codeData.test_cases.map((pair, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="Ввод (stdin)"
                      value={pair[0]}
                      onChange={(e) => {
                        const next = [...codeData.test_cases];
                        next[i] = [e.target.value, next[i][1]];
                        setCodeData((p) => ({ ...p, test_cases: next }));
                      }}
                      className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 text-sm font-mono"
                    />
                    <span className="text-dark-500 pt-2">→</span>
                    <input
                      type="text"
                      placeholder="Ожидаемый вывод"
                      value={pair[1]}
                      onChange={(e) => {
                        const next = [...codeData.test_cases];
                        next[i] = [next[i][0], e.target.value];
                        setCodeData((p) => ({ ...p, test_cases: next }));
                      }}
                      className="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 text-sm font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-red-400 hover:text-red-300"
                      onClick={() => {
                        const next = codeData.test_cases.filter((_, j) => j !== i);
                        setCodeData((p) => ({ ...p, test_cases: next.length ? next : [['', '']] }));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => setCodeData((p) => ({ ...p, test_cases: [...p.test_cases, ['', '']] }))}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить тест
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Лимит времени (сек)"
                type="number"
                value={String(codeData.execution_time_limit)}
                onChange={(e) => setCodeData((p) => ({ ...p, execution_time_limit: Math.max(1, parseInt(e.target.value, 10) || 5) }))}
              />
              <Input
                label="Лимит памяти (МБ)"
                type="number"
                value={String(codeData.execution_memory_limit)}
                onChange={(e) => setCodeData((p) => ({ ...p, execution_memory_limit: Math.max(64, parseInt(e.target.value, 10) || 256) }))}
              />
            </div>
            {feedbackSection}
          </>
        )}

        {blockName === 'free-answer' && (
          <>
            {conditionSection(5, 'Опишите задание для студента...')}
            <FormSection title="Настройки ответа" icon={<Settings2 className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Paperclip className="w-4 h-4" /></div>
                  <Toggle checked={freeAnswer.is_attachments_enabled} onChange={(v) => setFreeAnswer((p) => ({ ...p, is_attachments_enabled: v }))} label="Вложения" description="Разрешить прикреплять файлы" size="sm" />
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Code className="w-4 h-4" /></div>
                  <Toggle checked={freeAnswer.is_html_enabled} onChange={(v) => setFreeAnswer((p) => ({ ...p, is_html_enabled: v }))} label="HTML" description="Разрешить форматирование" size="sm" />
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><UserCheck className="w-4 h-4" /></div>
                  <Toggle checked={freeAnswer.manual_scoring} onChange={(v) => setFreeAnswer((p) => ({ ...p, manual_scoring: v }))} label="Ручная оценка" description="Преподаватель проверяет" size="sm" />
                </div>
              </div>
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'math' && (
          <>
            {conditionSection(5, 'Введите условие математической задачи...')}
            <FormSection title="Правильный ответ" icon={<Calculator className="w-4 h-4" />} variant="highlight">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Ответ (число или формула)" value={mathData.answer} onChange={(e) => setMathData((p) => ({ ...p, answer: e.target.value }))} placeholder="например: 42 или 1.5" icon={<Hash className="w-4 h-4" />} />
                <Input label="Допустимая погрешность" value={mathData.maxError} onChange={(e) => setMathData((p) => ({ ...p, maxError: e.target.value }))} placeholder="1e-06" hint="Для сравнения с плавающей точкой" />
              </div>
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'number' && (
          <>
            {conditionSection(4, 'Введите условие задачи...')}
            <FormSection title="Правильные ответы" icon={<Hash className="w-4 h-4" />} description="Укажите допустимые числовые ответы с погрешностью" variant="highlight">
              <div className="space-y-3">
                {numberOptions.map((opt, i) => (
                  <OptionCard
                    key={i}
                    onDelete={() => {
                      const next = numberOptions.filter((_, j) => j !== i);
                      setNumberOptions(next.length ? next : [{ answer: '', maxError: '' }]);
                    }}
                  >
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <div className="text-xs text-dark-500 mb-1">Правильный ответ</div>
                        <input
                          type="text"
                          value={opt.answer}
                          onChange={(e) => {
                            const next = [...numberOptions];
                            next[i] = { ...next[i], answer: e.target.value };
                            setNumberOptions(next);
                          }}
                          placeholder="42"
                          className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-dark-500 mb-1">Погрешность (опционально)</div>
                        <input
                          type="text"
                          value={opt.maxError}
                          onChange={(e) => {
                            const next = [...numberOptions];
                            next[i] = { ...next[i], maxError: e.target.value };
                            setNumberOptions(next);
                          }}
                          placeholder="0.01"
                          className="w-full px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>
                    </div>
                  </OptionCard>
                ))}
              </div>
              <AddButton variant="dashed" fullWidth className="mt-3" icon={<Plus className="w-4 h-4" />} onClick={() => setNumberOptions([...numberOptions, { answer: '', maxError: '' }])}>
                Добавить вариант ответа
              </AddButton>
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'sorting' && (
          <>
            {conditionSection(4, 'Расположите элементы в правильном порядке...')}
            <FormSection title="Элементы для сортировки" icon={<ArrowUpDown className="w-4 h-4" />} description="Перетаскивайте элементы, чтобы задать правильный порядок" variant="highlight">
              <SortableList
                items={sortingOptions}
                onReorder={(reordered) => setSortingOptions(reordered)}
                className="pl-0"
                renderItem={(opt, index) => (
                  <div className="flex gap-3 items-center p-3 rounded-xl bg-dark-800/50 border border-dark-600 hover:border-primary-500/30 transition-colors group">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-dark-500 cursor-grab active:cursor-grabbing" />
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-500/10 text-primary-400 text-sm font-medium">{index + 1}</div>
                    </div>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const next = [...sortingOptions];
                        const idx = next.findIndex((o) => o.id === opt.id);
                        if (idx !== -1) {
                          next[idx] = { ...next[idx], text: e.target.value };
                          setSortingOptions(next);
                        }
                      }}
                      placeholder="Введите текст элемента..."
                      className="flex-1 px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = sortingOptions.filter((o) => o.id !== opt.id);
                        setSortingOptions(next.length ? next : [{ id: Date.now(), text: '' }]);
                      }}
                      className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              />
              <AddButton
                variant="dashed"
                fullWidth
                className="mt-3"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  const newId = Math.max(...sortingOptions.map((o) => o.id), 0) + 1;
                  setSortingOptions([...sortingOptions, { id: newId, text: '' }]);
                }}
              >
                Добавить элемент
              </AddButton>
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'string' && (
          <>
            {conditionSection(4, 'Введите условие задания...')}
            <FormSection title="Шаблон ответа" icon={<Regex className="w-4 h-4" />} description="Укажите ожидаемый ответ или регулярное выражение" variant="highlight">
              <Input value={stringData.pattern} onChange={(e) => setStringData((p) => ({ ...p, pattern: e.target.value }))} placeholder="Регулярное выражение или точная строка" icon={<Regex className="w-4 h-4" />} />
            </FormSection>
            <FormSection title="Настройки проверки" icon={<Settings2 className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><Regex className="w-4 h-4" /></div>
                  <Toggle checked={stringData.use_re} onChange={(v) => setStringData((p) => ({ ...p, use_re: v }))} label="Регулярные выражения" description="Использовать regex" size="sm" />
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Type className="w-4 h-4" /></div>
                  <Toggle checked={stringData.match_substring} onChange={(v) => setStringData((p) => ({ ...p, match_substring: v }))} label="Совпадение подстроки" description="Частичное совпадение" size="sm" />
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Type className="w-4 h-4" /></div>
                  <Toggle checked={stringData.case_sensitive} onChange={(v) => setStringData((p) => ({ ...p, case_sensitive: v }))} label="Учитывать регистр" description="Case-sensitive" size="sm" />
                </div>
              </div>
            </FormSection>
            <FormSection title="Код проверки" icon={<Code className="w-4 h-4" />} description="Python-код для дополнительной валидации (необязательно)">
              <textarea
                value={stringData.code}
                onChange={(e) => setStringData((p) => ({ ...p, code: e.target.value }))}
                rows={4}
                placeholder="# Python-код проверки..."
                className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
              />
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'fill-blanks' && (
          <>
            {conditionSection(4, 'Введите описание задания...')}
            <FormSection title="Настройки" icon={<Settings2 className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Toggle checked={fillBlanks.isCaseSensitive} onChange={(v) => setFillBlanks((p) => ({ ...p, isCaseSensitive: v }))} label="Учитывать регистр" description="Ответ должен точно совпадать по регистру" size="sm" />
                <Toggle checked={fillBlanks.isDetailedFeedback} onChange={(v) => setFillBlanks((p) => ({ ...p, isDetailedFeedback: v }))} label="Детальный фидбэк" description="Показывать подробную информацию" size="sm" />
                <Toggle checked={fillBlanks.isPartiallyCorrect} onChange={(v) => setFillBlanks((p) => ({ ...p, isPartiallyCorrect: v }))} label="Частичные баллы" description="Начислять баллы за часть ответов" size="sm" />
              </div>
            </FormSection>
            <FormSection title="Компоненты" icon={<ListChecks className="w-4 h-4" />} description="Текстовые фрагменты и пропуски для заполнения" variant="highlight">
              <div className="space-y-3">
                {fillBlanks.components.map((c, i) => (
                  <OptionCard
                    key={i}
                    onDelete={() => {
                      const next = fillBlanks.components.filter((_, j) => j !== i);
                      setFillBlanks((p) => ({ ...p, components: next.length ? next : [{ type: 'text', text: '', options: [] }] }));
                    }}
                    className={c.type === 'blank' ? 'border-primary-500/30 bg-primary-500/5' : ''}
                  >
                    <div className="space-y-3">
                      <div className="flex gap-3 items-start">
                        <select
                          value={c.type}
                          onChange={(e) => {
                            const next = [...fillBlanks.components];
                            const newType = e.target.value as 'text' | 'blank';
                            next[i] = { ...next[i], type: newType, inputType: newType === 'blank' && !next[i].inputType ? 'input' : next[i].inputType };
                            setFillBlanks((p) => ({ ...p, components: next }));
                          }}
                          className="px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
                        >
                          <option value="text">📝 Текст</option>
                          <option value="blank">✏️ Пропуск</option>
                        </select>
                        <input
                          type="text"
                          value={c.text}
                          onChange={(e) => {
                            const next = [...fillBlanks.components];
                            next[i] = { ...next[i], text: e.target.value };
                            setFillBlanks((p) => ({ ...p, components: next }));
                          }}
                          placeholder={c.type === 'text' ? 'Введите текст...' : 'Текст перед пропуском (опционально)'}
                          className="flex-1 px-3 py-2 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm placeholder-dark-500 focus:ring-2 focus:ring-primary-500/50"
                        />
                      </div>

                      {c.type === 'blank' && (
                        <div className="pl-4 border-l-2 border-primary-500/30 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-dark-400">Тип ввода:</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...fillBlanks.components];
                                  next[i] = { ...next[i], inputType: 'input' };
                                  setFillBlanks((p) => ({ ...p, components: next }));
                                }}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${(c.inputType || 'input') === 'input' ? 'bg-primary-500/20 border-primary-500/50 text-primary-300' : 'bg-dark-700/50 border-dark-600 text-dark-400 hover:border-dark-500'}`}
                              >
                                Текстовое поле
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...fillBlanks.components];
                                  next[i] = { ...next[i], inputType: 'select' };
                                  setFillBlanks((p) => ({ ...p, components: next }));
                                }}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${c.inputType === 'select' ? 'bg-primary-500/20 border-primary-500/50 text-primary-300' : 'bg-dark-700/50 border-dark-600 text-dark-400 hover:border-dark-500'}`}
                              >
                                Выпадающий список
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-xs text-dark-400">Варианты ответов:</span>
                            {c.options.map((o, j) => (
                              <div key={j} className="flex gap-2 items-center group">
                                <Checkbox
                                  checked={o.is_correct}
                                  onChange={(v) => {
                                    const next = [...fillBlanks.components];
                                    const opts = [...(next[i].options || [])];
                                    opts[j] = { ...opts[j], is_correct: v };
                                    next[i] = { ...next[i], options: opts };
                                    setFillBlanks((p) => ({ ...p, components: next }));
                                  }}
                                  variant="success"
                                />
                                <input
                                  type="text"
                                  value={o.text}
                                  onChange={(e) => {
                                    const next = [...fillBlanks.components];
                                    const opts = [...(next[i].options || [])];
                                    opts[j] = { ...opts[j], text: e.target.value };
                                    next[i] = { ...next[i], options: opts };
                                    setFillBlanks((p) => ({ ...p, components: next }));
                                  }}
                                  placeholder="Введите вариант ответа..."
                                  className={`flex-1 px-3 py-1.5 bg-dark-700/50 border rounded-lg text-sm placeholder-dark-500 focus:ring-2 focus:ring-primary-500/50 ${o.is_correct ? 'border-emerald-500/40 text-emerald-200' : 'border-dark-600 text-dark-100'}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...fillBlanks.components];
                                    const opts = (next[i].options || []).filter((_, k) => k !== j);
                                    next[i] = { ...next[i], options: opts };
                                    setFillBlanks((p) => ({ ...p, components: next }));
                                  }}
                                  className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <AddButton
                              variant="dashed"
                              onClick={() => {
                                const next = [...fillBlanks.components];
                                const opts = [...(next[i].options || []), { text: '', is_correct: false }];
                                next[i] = { ...next[i], options: opts };
                                setFillBlanks((p) => ({ ...p, components: next }));
                              }}
                            >
                              Добавить вариант
                            </AddButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </OptionCard>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <AddButton variant="default" icon={<FileText className="w-4 h-4" />} onClick={() => setFillBlanks((p) => ({ ...p, components: [...p.components, { type: 'text', text: '', options: [] }] }))}>
                  Добавить текст
                </AddButton>
                <AddButton variant="default" icon={<TextCursorInput className="w-4 h-4" />} onClick={() => setFillBlanks((p) => ({ ...p, components: [...p.components, { type: 'blank', text: '', options: [], inputType: 'input' }] }))}>
                  Добавить пропуск
                </AddButton>
              </div>
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'table' && (
          <>
            {conditionSection(4, 'Опишите задание для студента...')}
            <FormSection title="Колонки таблицы" icon={<Columns className="w-4 h-4" />} description="Заголовки колонок для выбора">
              <div className="flex flex-wrap gap-2">
                {tableData.columnNames.map((col, i) => (
                  <div key={i} className="group flex items-center gap-1 p-1 pr-2 rounded-lg bg-dark-800/50 border border-dark-600 hover:border-primary-500/30 transition-colors">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-primary-500/10 text-primary-400 text-xs font-medium">{i + 1}</div>
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => {
                        const next = [...tableData.columnNames];
                        next[i] = e.target.value;
                        setTableData((p) => ({ ...p, columnNames: next }));
                      }}
                      placeholder={`Колонка ${i + 1}`}
                      className="w-28 px-2 py-1 bg-transparent border-none text-dark-100 text-sm focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = tableData.columnNames.filter((_, j) => j !== i);
                        const cols = next.length ? next : [''];
                        const rows = tableData.rows.map((r) => ({ ...r, columns: r.columns.filter((_, j) => j !== i) }));
                        setTableData({ columnNames: cols, rows });
                      }}
                      className="p-1 rounded text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <AddButton
                variant="dashed"
                className="mt-3"
                icon={<Columns className="w-4 h-4" />}
                onClick={() => setTableData((p) => ({ columnNames: [...p.columnNames, ''], rows: p.rows.map((r) => ({ ...r, columns: [...r.columns, false] })) }))}
              >
                Добавить колонку
              </AddButton>
            </FormSection>
            <FormSection title="Строки и правильные ответы" icon={<Rows className="w-4 h-4" />} description="Отметьте правильные ячейки для каждой строки" variant="highlight">
              {tableData.columnNames.length > 0 && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-dark-700/50">
                  <div className="w-40 text-xs font-medium text-dark-400 uppercase tracking-wider">Строка</div>
                  <div className="flex-1 flex gap-2">
                    {tableData.columnNames.map((col, ci) => (
                      <div key={ci} className="flex-1 min-w-[80px] text-center text-xs font-medium text-primary-400 truncate" title={col || `Колонка ${ci + 1}`}>
                        {col || `Кол. ${ci + 1}`}
                      </div>
                    ))}
                  </div>
                  <div className="w-8" />
                </div>
              )}
              <div className="space-y-2">
                {tableData.rows.map((row, ri) => (
                  <div key={ri} className="group flex items-center gap-2 p-2 rounded-xl bg-dark-800/30 border border-dark-700/30 hover:border-dark-600 transition-colors">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => {
                        const next = [...tableData.rows];
                        next[ri] = { ...next[ri], name: e.target.value };
                        setTableData((p) => ({ ...p, rows: next }));
                      }}
                      placeholder={`Строка ${ri + 1}`}
                      className="w-40 px-3 py-1.5 bg-dark-700/50 border border-dark-600 rounded-lg text-dark-100 text-sm focus:ring-2 focus:ring-primary-500/50"
                    />
                    <div className="flex-1 flex gap-2">
                      {row.columns.map((ch, ci) => (
                        <div key={ci} className="flex-1 min-w-[80px] flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...tableData.rows];
                              const cols = [...next[ri].columns];
                              cols[ci] = !cols[ci];
                              next[ri] = { ...next[ri], columns: cols };
                              setTableData((p) => ({ ...p, rows: next }));
                            }}
                            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${ch ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-dark-700/50 border-dark-600 text-dark-500 hover:border-dark-500 hover:text-dark-400'}`}
                            title={`${tableData.columnNames[ci] || `Колонка ${ci + 1}`}: ${ch ? 'Правильно' : 'Неправильно'}`}
                          >
                            {ch ? <CheckCircle className="w-5 h-5" /> : <span className="text-lg opacity-30">○</span>}
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = tableData.rows.filter((_, j) => j !== ri);
                        setTableData((p) => ({ ...p, rows: next.length ? next : [{ name: '', columns: p.columnNames.map(() => false) }] }));
                      }}
                      className="w-8 p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <AddButton variant="dashed" fullWidth className="mt-3" icon={<Rows className="w-4 h-4" />} onClick={() => setTableData((p) => ({ ...p, rows: [...p.rows, { name: '', columns: p.columnNames.map(() => false) }] }))}>
                Добавить строку
              </AddButton>
            </FormSection>
            {feedbackSection}
          </>
        )}

        {blockName === 'random-tasks' && (
          <>
            {conditionSection(4, 'Общее описание задачи...')}
            <FormSection title="Шаблон задачи (task)" icon={<Code className="w-4 h-4" />} description="Python-код для генерации текста и параметров задачи" variant="highlight">
              <textarea
                value={randomTasks.task}
                onChange={(e) => setRandomTasks((p) => ({ ...p, task: e.target.value }))}
                rows={5}
                placeholder="# Код генерации задачи..."
                className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
              />
            </FormSection>
            <FormSection title="Шаблон решения (solve)" icon={<Code className="w-4 h-4" />} description="Python-код для вычисления правильного ответа">
              <textarea
                value={randomTasks.solve}
                onChange={(e) => setRandomTasks((p) => ({ ...p, solve: e.target.value }))}
                rows={5}
                placeholder="# Код решения..."
                className="w-full px-4 py-3 bg-dark-900/50 border border-dark-600 rounded-xl text-dark-100 font-mono text-sm focus:ring-2 focus:ring-primary-500/50"
              />
            </FormSection>
            <FormSection title="Настройки проверки" icon={<Settings2 className="w-4 h-4" />}>
              <Input label="Допустимая погрешность (max_error)" value={randomTasks.maxError} onChange={(e) => setRandomTasks((p) => ({ ...p, maxError: e.target.value }))} placeholder="0.01" hint="Для числовых ответов" icon={<Hash className="w-4 h-4" />} />
            </FormSection>
            {feedbackSection}
          </>
        )}

        {!Object.keys(BLOCK_META).includes(blockName) && (
          <>
            {conditionSection(5, 'Текст задания...')}
            <FormSection title="Данные блока (source, JSON)" icon={<Settings2 className="w-4 h-4" />} description="Расширенное редактирование структуры шага">
              <Textarea value={sourceJson} onChange={(e) => setSourceJson(e.target.value)} rows={10} className="font-mono text-xs" />
            </FormSection>
            {feedbackSection}
          </>
        )}
      </div>
    </Modal>
  );
}
