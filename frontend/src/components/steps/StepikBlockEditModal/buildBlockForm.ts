import toast from 'react-hot-toast';
import type { StepikBlockRequest } from '../../../types';
import type { BlockFormFields } from './parseBlockForm';
import { makeMatchingPairsUnique } from './utils';

export function buildBlockFromFormFields(
  block: StepikBlockRequest,
  blockName: string,
  fields: BlockFormFields
): StepikBlockRequest | null {
  const fc = fields.feedbackCorrect.trim() || undefined;
  const fw = fields.feedbackWrong.trim() || undefined;
  const base = {
    ...block,
    name: blockName,
    text: fields.text,
    video: block.video ?? null,
    options: null as unknown,
    feedback_correct: fc,
    feedback_wrong: fw,
  };

  if (blockName === 'choice') {
    const correctCount = fields.choiceOptions.filter((o) => o.is_correct).length;
    return {
      ...base,
      source: {
        ...fields.choiceSourceRest,
        sample_size: fields.choiceOptions.length,
        is_multiple_choice: correctCount > 1,
        options: fields.choiceOptions,
      },
    };
  }

  if (blockName === 'matching') {
    return {
      ...base,
      source: { ...fields.matchingSourceRest, pairs: makeMatchingPairsUnique(fields.matchingPairs) },
    };
  }

  if (blockName === 'code') {
    return {
      ...base,
      source: {
        code: fields.codeData.code,
        templates_data: fields.codeData.templates_data,
        test_cases: fields.codeData.test_cases,
        execution_time_limit: fields.codeData.execution_time_limit,
        execution_memory_limit: fields.codeData.execution_memory_limit,
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
  }

  if (blockName === 'free-answer') {
    return {
      ...base,
      source: {
        is_attachments_enabled: fields.freeAnswer.is_attachments_enabled,
        is_html_enabled: fields.freeAnswer.is_html_enabled,
        manual_scoring: fields.freeAnswer.manual_scoring,
      },
    };
  }

  if (blockName === 'math') {
    const mathNtRest = fields.mathNtRest;
    return {
      ...base,
      source: {
        answer: fields.mathData.answer,
        numerical_test: {
          z_re_min: typeof mathNtRest.z_re_min === 'string' ? mathNtRest.z_re_min : '-1e308',
          z_re_max: typeof mathNtRest.z_re_max === 'string' ? mathNtRest.z_re_max : '1e308',
          z_im_min: typeof mathNtRest.z_im_min === 'string' ? mathNtRest.z_im_min : '-1e308',
          z_im_max: typeof mathNtRest.z_im_max === 'string' ? mathNtRest.z_im_max : '1e308',
          max_error: fields.mathData.maxError,
          integer_only: typeof mathNtRest.integer_only === 'boolean' ? mathNtRest.integer_only : false,
        },
      },
    };
  }

  if (blockName === 'number') {
    return {
      ...base,
      source: {
        ...fields.numberSourceRest,
        options: fields.numberOptions.map((o) => ({ answer: o.answer, max_error: o.maxError || '' })),
      },
    };
  }

  if (blockName === 'sorting') {
    return {
      ...base,
      source: {
        ...fields.sortingSourceRest,
        options: fields.sortingOptions.map(({ text: t }) => ({ text: t })),
      },
    };
  }

  if (blockName === 'string') {
    return {
      ...base,
      source: {
        pattern: fields.stringData.pattern || undefined,
        use_re: fields.stringData.use_re,
        match_substring: fields.stringData.match_substring,
        case_sensitive: fields.stringData.case_sensitive,
        code: fields.stringData.code || undefined,
      },
    };
  }

  if (blockName === 'fill-blanks') {
    const components: Array<{ type: 'text' | 'input' | 'select'; text: string; options: Array<{ text: string; is_correct: boolean }> }> = [];
    for (const c of fields.fillBlanks.components) {
      if (c.type === 'text') {
        components.push({ type: 'text', text: c.text, options: [] });
      } else {
        const textBeforeBlank = c.text.trim();
        if (textBeforeBlank) components.push({ type: 'text', text: textBeforeBlank, options: [] });
        components.push({ type: c.inputType === 'select' ? 'select' : 'input', text: '', options: c.options });
      }
    }
    return {
      ...base,
      source: {
        components,
        is_case_sensitive: fields.fillBlanks.isCaseSensitive,
        is_detailed_feedback: fields.fillBlanks.isDetailedFeedback,
        is_partially_correct: fields.fillBlanks.isPartiallyCorrect,
      },
    };
  }

  if (blockName === 'table') {
    const columns = fields.tableData.columnNames.map((name) => ({ name: typeof name === 'string' ? name : '' }));
    const rows = fields.tableData.rows.map((r) => ({
      name: typeof r.name === 'string' ? r.name : '',
      columns: r.columns.map((choice) => ({ choice: !!choice })),
    }));
    const hasMultipleCorrect = fields.tableData.rows.some((r) => r.columns.filter(Boolean).length > 1);
    const options: Record<string, unknown> = { ...fields.tableOptions, sample_size: fields.tableData.rows.length };
    if (hasMultipleCorrect) options.is_checkbox = true;
    return { ...base, source: { rows, columns, options, description: '' } };
  }

  if (blockName === 'random-tasks') {
    return {
      ...base,
      source: {
        task: fields.randomTasks.task,
        solve: fields.randomTasks.solve,
        max_error: fields.randomTasks.maxError || '',
      },
    };
  }

  if (blockName === 'text') {
    const { source: _drop, ...rest } = base as Record<string, unknown>;
    return rest as unknown as StepikBlockRequest;
  }

  let parsedSource: unknown = block.source;
  if (fields.sourceJson.trim()) {
    try {
      parsedSource = JSON.parse(fields.sourceJson);
    } catch {
      toast.error('Некорректный JSON в поле source');
      return null;
    }
  }
  return { ...base, source: parsedSource };
}
