import type { StepikBlockRequest } from '../../../types';
import type {
  ChoiceOptionEdit,
  MatchingPairEdit,
  NumberOptionEdit,
  SortingOptionEdit,
  FillBlanksComponentEdit,
  TableRowEdit,
  CodeEditData,
  FreeAnswerEditData,
  MathEditData,
  StringEditData,
  FillBlanksEditData,
  TableEditData,
  RandomTasksEditData,
} from './types';
import { asRecord } from './utils';

export interface BlockFormFields {
  text: string;
  feedbackCorrect: string;
  feedbackWrong: string;
  choiceOptions: ChoiceOptionEdit[];
  choiceSourceRest: Record<string, unknown>;
  matchingPairs: MatchingPairEdit[];
  matchingSourceRest: Record<string, unknown>;
  codeData: CodeEditData;
  freeAnswer: FreeAnswerEditData;
  mathData: MathEditData;
  mathNtRest: Record<string, unknown>;
  numberOptions: NumberOptionEdit[];
  numberSourceRest: Record<string, unknown>;
  sortingOptions: SortingOptionEdit[];
  sortingSourceRest: Record<string, unknown>;
  stringData: StringEditData;
  fillBlanks: FillBlanksEditData;
  tableData: TableEditData;
  tableOptions: Record<string, unknown>;
  randomTasks: RandomTasksEditData;
  sourceJson: string;
}

export function parseBlockToFormFields(block: StepikBlockRequest, blockName: string): Partial<BlockFormFields> {
  const fields: Partial<BlockFormFields> = {
    text: block.text || '',
    feedbackCorrect: block.feedback_correct || '',
    feedbackWrong: block.feedback_wrong || '',
  };

  const src = asRecord(block.source);

  if (blockName === 'choice') {
    const opts = Array.isArray(src.options) ? src.options : [];
    fields.choiceOptions =
      opts.length > 0
        ? opts.map((o) => {
            const x = o as { text?: string; is_correct?: boolean; feedback?: string };
            return {
              text: typeof x.text === 'string' ? x.text : '',
              is_correct: !!x.is_correct,
              feedback: typeof x.feedback === 'string' ? x.feedback : '',
            };
          })
        : [{ text: '', is_correct: false, feedback: '' }];
    const { options: _o, ...rest } = src;
    fields.choiceSourceRest = rest;
  } else if (blockName === 'matching') {
    let rawPairs = src.pairs as unknown;
    if (!rawPairs && Array.isArray(src.options)) {
      rawPairs = (src.options as { text?: string; match?: string }[]).map((o) => ({
        first: o.text ?? '',
        second: o.match ?? '',
      }));
    }
    fields.matchingPairs =
      Array.isArray(rawPairs) && rawPairs.length > 0
        ? rawPairs.map((p) => {
            const x = p as { first?: string; second?: string };
            return {
              first: typeof x.first === 'string' ? x.first : '',
              second: typeof x.second === 'string' ? x.second : '',
            };
          })
        : [{ first: '', second: '' }];
    const { pairs: _p, options: _o, ...rest } = src;
    fields.matchingSourceRest = rest;
  } else if (blockName === 'code') {
    const testCases = Array.isArray(src.test_cases) ? src.test_cases : [];
    fields.codeData = {
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
    };
  } else if (blockName === 'free-answer') {
    fields.freeAnswer = {
      is_attachments_enabled: !!src.is_attachments_enabled,
      is_html_enabled: !!src.is_html_enabled,
      manual_scoring: !!src.manual_scoring,
    };
  } else if (blockName === 'math') {
    const nt = asRecord(src.numerical_test);
    fields.mathData = {
      answer: typeof src.answer === 'string' ? src.answer : '',
      maxError: typeof nt.max_error === 'string' ? nt.max_error : '1e-06',
    };
    fields.mathNtRest = nt;
  } else if (blockName === 'number') {
    const opts = Array.isArray(src.options) ? src.options : [];
    fields.numberOptions =
      opts.length > 0
        ? opts.map((o) => {
            const x = o as { answer?: string; max_error?: string };
            return {
              answer: typeof x.answer === 'string' ? x.answer : '',
              maxError: typeof x.max_error === 'string' ? x.max_error : '',
            };
          })
        : [{ answer: '', maxError: '' }];
    const { options: _o, ...rest } = src;
    fields.numberSourceRest = rest;
  } else if (blockName === 'sorting') {
    const opts = Array.isArray(src.options) ? src.options : [];
    fields.sortingOptions =
      opts.length > 0
        ? opts.map((o, index) => {
            const x = o as { text?: string };
            return { id: index + 1, text: typeof x.text === 'string' ? x.text : '' };
          })
        : [{ id: 1, text: '' }];
    const { options: _o, ...rest } = src;
    fields.sortingSourceRest = rest;
  } else if (blockName === 'string') {
    fields.stringData = {
      pattern: typeof src.pattern === 'string' ? src.pattern : '',
      use_re: !!src.use_re,
      match_substring: !!src.match_substring,
      case_sensitive: !!src.case_sensitive,
      code: typeof src.code === 'string' ? src.code : '',
    };
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
    fields.fillBlanks = {
      components,
      isCaseSensitive: !!src.is_case_sensitive,
      isDetailedFeedback: !!src.is_detailed_feedback,
      isPartiallyCorrect: !!src.is_partially_correct,
    };
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
    fields.tableData = { columnNames, rows: tableRows };
    fields.tableOptions = asRecord(src.options);
  } else if (blockName === 'random-tasks') {
    fields.randomTasks = {
      task: typeof src.task === 'string' ? src.task : '',
      solve: typeof src.solve === 'string' ? src.solve : '',
      maxError: typeof src.max_error === 'string' ? src.max_error : '',
    };
  } else if (!['text'].includes(blockName)) {
    try {
      fields.sourceJson = block.source ? JSON.stringify(block.source, null, 2) : '{}';
    } catch {
      fields.sourceJson = '{}';
    }
  }

  return fields;
}
