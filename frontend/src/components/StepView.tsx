import { CheckCircle, XCircle } from 'lucide-react';
import { Badge } from './ui';
import type { Step } from '../types';
import { getStepDisplayType } from '../types';

interface StepViewProps {
  step: Step;
}

interface StepikBlock {
  name: string | null;
  text?: string;
  video?: string | null;
  source?: {
    options?: Array<{
      text?: string;
      is_correct?: boolean;
      feedback?: string;
      match?: string;
      answer?: unknown;
      [key: string]: unknown;
    } | string>;
    pairs?: Array<{ first?: string; second?: string }>;
    components?: unknown[];
    rows?: unknown[];
    columns?: unknown[];
    pattern?: string;
    code?: string;
    templates_data?: string;
    test_cases?: unknown;
    isAttachmentsEnabled?: boolean;
    isHtmlEnabled?: boolean;
    manualScoring?: boolean;
    [key: string]: unknown;
  };
  options?: { is_multiple_choice?: boolean; [key: string]: unknown };
  feedback_correct?: string;
  feedback_wrong?: string;
  [key: string]: unknown;
}

/** Определяет тип блока по структуре source, если name отсутствует или null. */
function inferBlockName(block: StepikBlock): string {
  const src = block.source;
  if (!src) return 'text';

  if (src.code !== undefined || src.templates_data !== undefined || src.test_cases !== undefined) {
    return 'code';
  }
  if (Array.isArray(src.pairs) && src.pairs.length > 0) {
    return 'matching';
  }
  if (Array.isArray(src.components) && src.components.length > 0) {
    return 'fill-blanks';
  }
  if (Array.isArray(src.rows) && Array.isArray(src.columns)) {
    return 'table';
  }
  if (typeof src.pattern === 'string') {
    return 'string';
  }
  if (
    src.isAttachmentsEnabled !== undefined ||
    src.isHtmlEnabled !== undefined ||
    src.manualScoring !== undefined
  ) {
    return 'free-answer';
  }
  const s = src as Record<string, unknown>;
  if (
    'task' in s ||
    'solve' in s ||
    'max_error' in s ||
    (Array.isArray(s.tasks) && s.tasks.length > 0)
  ) {
    return 'random-tasks';
  }

  const opts = src.options;
  if (Array.isArray(opts) && opts.length > 0) {
    const first = opts[0];
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      if ('answer' in first || 'maxError' in first) return 'number';
      if ('is_correct' in first) return 'choice';
      if ('match' in first) return 'matching';
    }
    if (block.options?.is_multiple_choice) return 'choice';
    return 'sorting';
  }

  return 'text';
}

export function StepView({ step }: StepViewProps) {
  let blockData: StepikBlock | null = null;

  if (step.stepikBlockData) {
    try {
      if (typeof step.stepikBlockData === 'string') {
        blockData = JSON.parse(step.stepikBlockData) as StepikBlock;
      } else {
        blockData = step.stepikBlockData as unknown as StepikBlock;
      }
    } catch (error) {
      console.error('Failed to parse stepikBlockData:', error);
    }
  }

  const renderBlockContent = () => {
    if (!blockData) {
      // If no block data, show content field
      return (
        <div 
          className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[500px] overflow-y-auto prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: step.content || '<p class="text-dark-500">Нет содержимого</p>' 
          }}
        />
      );
    }

    const blockName =
      blockData.name != null && String(blockData.name).trim() !== ''
        ? String(blockData.name).trim()
        : inferBlockName(blockData);
    const blockText = blockData.text || step.content || '';

    return (
      <div className="space-y-4">
        {blockText && blockName !== 'text' && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Вопрос/Текст</label>
            <div 
              className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[500px] overflow-y-auto prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: blockText || '<p class="text-dark-500">Нет текста</p>' 
              }}
            />
          </div>
        )}

        {/* Video */}
        {blockData.video && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Видео</label>
            <div className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100">
              <p className="text-sm">{String(blockData.video)}</p>
            </div>
          </div>
        )}

        {/* Choice Options */}
        {blockName === 'choice' && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Варианты ответов</label>
            {blockData.source?.options && Array.isArray(blockData.source.options) && blockData.source.options.length > 0 ? (
              <div className="space-y-2">
                {blockData.source.options.map((option: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      option.is_correct
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-dark-800 border-dark-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {option.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-dark-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div 
                          className="text-dark-100 prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: option.text || 'Без текста' }}
                        />
                        {option.feedback && (
                          <p className="text-sm text-dark-400 mt-2">
                            <span className="font-medium">Обратная связь:</span>{' '}
                            <span dangerouslySetInnerHTML={{ __html: option.feedback }} />
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-dark-800 border border-dark-600 text-dark-400 text-sm">
                Варианты ответов не найдены в stepikBlockData
              </div>
            )}
          </div>
        )}

        {/* Matching Pairs */}
        {blockName === 'matching' && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Пары для сопоставления</label>
            {(() => {
              let pairs = blockData.source?.pairs;

              if (!pairs && Array.isArray(blockData.source?.options)) {
                pairs = blockData.source.options.map((o: any) => ({
                  first: o.text,
                  second: o.match,
                }));
              }

              if (Array.isArray(pairs) && pairs.length) {
                return (
                  <div className="space-y-2">
                    {pairs.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="grid grid-cols-2 gap-4 p-3 border border-dark-600 rounded-lg bg-dark-800"
                      >
                        <div
                          className="prose prose-invert"
                          dangerouslySetInnerHTML={{ __html: p.first }}
                        />
                        <div
                          className="prose prose-invert"
                          dangerouslySetInnerHTML={{ __html: p.second }}
                        />
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <pre className="text-xs">
                  {JSON.stringify(blockData.source || {}, null, 2)}
                </pre>
              );
            })()}
          </div>
        )}

        {/* Sorting Options */}
        {blockName === 'sorting' && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Элементы для сортировки</label>

            {Array.isArray(blockData.source?.options) ? (
              <div className="space-y-2">
                {blockData.source.options.map((o: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-dark-800 border border-dark-600 rounded-lg"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    <div
                      className="prose prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: typeof o === 'string' ? o : o.text,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs">
                {JSON.stringify(blockData.source, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Fill Blanks */}
        {blockName === 'fill-blanks' && blockData.source && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Заполнение пропусков</label>
            {blockData.source.components && Array.isArray(blockData.source.components) ? (
              <div className="space-y-3">
                {blockData.source.components.map((component: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                    {component.type === 'text' ? (
                      <div 
                        className="text-dark-100 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: component.text || '' }}
                      />
                    ) : (component.type === 'blank' || component.type === 'input') ? (
                      <div>
                        {component.text ? (
                          <div 
                            className="text-dark-100 prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: component.text }}
                          />
                        ) : null}
                        <span className="text-xs text-dark-500 mt-1 block">Варианты ответов для пропуска:</span>
                        {Array.isArray(component.options) && component.options.length > 0 ? (
                          <div className="space-y-1 mt-1">
                            {component.options.map((opt: any, optIndex: number) => (
                              <div
                                key={optIndex}
                                className={`p-2 rounded border text-sm ${
                                  opt.is_correct
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-dark-700 border-dark-600 text-dark-300'
                                }`}
                              >
                                {opt.text ?? 'Без текста'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-dark-400 text-sm">[пропуск]</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
                {(blockData.source.is_case_sensitive !== undefined || blockData.source.is_detailed_feedback !== undefined || blockData.source.is_partially_correct !== undefined) && (
                  <div className="p-3 rounded-lg bg-dark-800/50 border border-dark-600 text-xs text-dark-400">
                    <div className="space-y-1">
                      {blockData.source.is_case_sensitive !== undefined && (
                        <p>Учитывать регистр: {blockData.source.is_case_sensitive ? 'Да' : 'Нет'}</p>
                      )}
                      {blockData.source.is_detailed_feedback !== undefined && (
                        <p>Детальная обратная связь: {blockData.source.is_detailed_feedback ? 'Да' : 'Нет'}</p>
                      )}
                      {blockData.source.is_partially_correct !== undefined && (
                        <p>Частично правильный ответ: {blockData.source.is_partially_correct ? 'Да' : 'Нет'}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-dark-800 border border-dark-600 text-dark-400 text-sm">
                Компоненты не найдены
              </div>
            )}
          </div>
        )}

        {/* Feedback Messages */}
        {(blockData.feedback_correct || blockData.feedback_wrong) && (
          <div className="space-y-2">
            {blockData.feedback_correct && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Обратная связь (правильно)</label>
                <div 
                  className="w-full px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-dark-100 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: blockData.feedback_correct }}
                />
              </div>
            )}
            {blockData.feedback_wrong && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Обратная связь (неправильно)</label>
                <div 
                  className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-dark-100 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: blockData.feedback_wrong }}
                />
              </div>
            )}
          </div>
        )}

        {/* String Input */}
        {blockName === 'string' && blockData.source && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Настройки ввода строки</label>
            <div className="space-y-3">
              {!!blockData.source.pattern && (
                <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <span className="text-xs text-dark-500 mb-1 block">Шаблон (pattern):</span>
                  <code className="text-sm text-primary-400">{String(blockData.source.pattern)}</code>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {blockData.source.useRe !== undefined && (
                  <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                    <span className="text-xs text-dark-500 mb-1 block">Использовать регулярные выражения:</span>
                    <span className="text-sm text-dark-100">{blockData.source.useRe ? 'Да' : 'Нет'}</span>
                  </div>
                )}
                {blockData.source.matchSubstring !== undefined && (
                  <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                    <span className="text-xs text-dark-500 mb-1 block">Совпадение подстроки:</span>
                    <span className="text-sm text-dark-100">{blockData.source.matchSubstring ? 'Да' : 'Нет'}</span>
                  </div>
                )}
                {blockData.source.caseSensitive !== undefined && (
                  <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                    <span className="text-xs text-dark-500 mb-1 block">Учитывать регистр:</span>
                    <span className="text-sm text-dark-100">{blockData.source.caseSensitive ? 'Да' : 'Нет'}</span>
                  </div>
                )}
                {!!blockData.source.code && (
                  <div className="p-3 rounded-lg bg-dark-800 border border-dark-600 col-span-2">
                    <span className="text-xs text-dark-500 mb-1 block">Код проверки:</span>
                    <pre className="text-xs text-dark-300 mt-1 whitespace-pre-wrap break-words">
                      {String(blockData.source.code || '')}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Number Input */}
        {blockName === 'number' && blockData.source?.options && Array.isArray(blockData.source.options) && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Правильные ответы (числа)</label>
            <div className="space-y-2">
              {blockData.source.options.map((option: any, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-dark-100 font-medium">
                        Ответ: <span className="text-primary-400">{option.answer || 'Не указано'}</span>
                      </div>
                      {option.maxError && (
                        <div className="text-sm text-dark-400 mt-1">
                          Максимальная погрешность: {option.maxError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Free Answer */}
        {blockName === 'free-answer' && blockData.source && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Настройки свободного ответа</label>
            <div className="grid grid-cols-2 gap-3">
              {blockData.source.isAttachmentsEnabled !== undefined && (
                <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <span className="text-xs text-dark-500 mb-1 block">Вложения разрешены:</span>
                  <span className="text-sm text-dark-100">{blockData.source.isAttachmentsEnabled ? 'Да' : 'Нет'}</span>
                </div>
              )}
              {blockData.source.isHtmlEnabled !== undefined && (
                <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <span className="text-xs text-dark-500 mb-1 block">HTML разрешен:</span>
                  <span className="text-sm text-dark-100">{blockData.source.isHtmlEnabled ? 'Да' : 'Нет'}</span>
                </div>
              )}
              {blockData.source.manualScoring !== undefined && (
                <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <span className="text-xs text-dark-500 mb-1 block">Ручная оценка:</span>
                  <span className="text-sm text-dark-100">{blockData.source.manualScoring ? 'Да' : 'Нет'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {blockName === 'table' && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Таблица</label>

            {Array.isArray(blockData.source?.rows) && Array.isArray(blockData.source?.columns) ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-dark-600 p-2">Строка</th>
                      {blockData.source.columns.map((c: any, i: number) => (
                        <th
                          key={i}
                          className="border border-dark-600 p-2"
                        >
                          {c.name ?? `Колонка ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {blockData.source.rows.map((row: any, ri: number) => (
                      <tr key={ri}>
                        <td className="border border-dark-600 p-2">
                          {row.name}
                        </td>
                        {(row.cells || row.columns || []).map(
                          (cell: any, ci: number) => (
                            <td
                              key={ci}
                              className="border border-dark-600 p-2 text-center"
                            >
                              {cell.choice ? (
                                <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-dark-400 mx-auto" />
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="text-xs">
                {JSON.stringify(blockData.source, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Text Block - просто показываем текст, если он есть */}
        {blockName === 'text' && blockText && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Текстовый контент</label>
            <div 
              className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 min-h-[100px] max-h-[500px] overflow-y-auto prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: blockText || '<p class="text-dark-500">Нет текста</p>' 
              }}
            />
          </div>
        )}

        {blockName === 'math' && blockData.source && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Математическая формула</label>
            <div className="space-y-3">
              {blockData.source.answer !== undefined && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <span className="text-xs text-dark-500 mb-1 block">Правильный ответ:</span>
                  <code className="text-sm text-primary-400">{String(blockData.source.answer)}</code>
                </div>
              )}
              {blockData.source.maxError !== undefined && (
                <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <span className="text-xs text-dark-500 mb-1 block">Максимальная погрешность:</span>
                  <span className="text-sm text-dark-100">{String(blockData.source.maxError)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {blockName === 'random-tasks' && blockData.source && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Случайные задания</label>
            <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
              <p className="text-sm text-dark-400">
                Этот тип шага содержит случайные задания, которые генерируются динамически.
              </p>
              {blockData.source.tasks && Array.isArray(blockData.source.tasks) ? (
                <p className="text-sm text-dark-100 mt-2">
                  Количество заданий: {blockData.source.tasks.length}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* Code (programming task) */}
        {blockName === 'code' && blockData.source && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Задача по программированию</label>
            <div className="space-y-3">
              {blockData.source.templates_data && (
                <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <span className="text-xs text-dark-500 mb-1 block">Язык:</span>
                  <code className="text-sm text-primary-400">
                    {String(blockData.source.templates_data).replace(/^::/, '') || '—'}
                  </code>
                </div>
              )}
              {blockData.source.code && (
                <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <span className="text-xs text-dark-500 mb-1 block">Код (шаблон/чекер):</span>
                  <pre className="text-xs text-dark-300 mt-1 whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
                    {String(blockData.source.code)}
                  </pre>
                </div>
              )}
              {Array.isArray(blockData.source.test_cases) && blockData.source.test_cases.length > 0 && (
                <div className="p-3 rounded-lg bg-dark-800 border border-dark-600">
                  <span className="text-xs text-dark-500 mb-2 block">Тестовые случаи:</span>
                  <div className="space-y-2">
                    {blockData.source.test_cases.map((pair: unknown, i: number) => {
                      const [inp, out] = Array.isArray(pair) && pair.length >= 2 ? [String(pair[0]), String(pair[1])] : ['', ''];
                      return (
                        <div key={i} className="flex gap-2 text-sm">
                          <span className="text-dark-500 flex-shrink-0">Ввод:</span>
                          <code className="text-dark-200 flex-1 break-all">{inp || '—'}</code>
                          <span className="text-dark-500 flex-shrink-0">→</span>
                          <span className="text-dark-500 flex-shrink-0">Вывод:</span>
                          <code className="text-primary-400 flex-1 break-all">{out || '—'}</code>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-4 text-xs text-dark-500">
                {blockData.source.execution_time_limit != null && (
                  <span>Время: {String(blockData.source.execution_time_limit)} с</span>
                )}
                {blockData.source.execution_memory_limit != null && (
                  <span>Память: {String(blockData.source.execution_memory_limit)} МБ</span>
                )}
              </div>
            </div>
          </div>
        )}

        {!['choice', 'matching', 'sorting', 'fill-blanks', 'text', 'string', 'number', 'free-answer', 'table', 'math', 'random-tasks', 'code'].includes(blockName) && blockData.source && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Данные шага (тип: {blockName})</label>
            <div className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 max-h-[300px] overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(blockData.source, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Badge variant={step.stepikStepId ? 'success' : 'info'}>
          {getStepDisplayType(step)}
        </Badge>
        {step.stepikStepId && (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Stepik ID: {step.stepikStepId}
          </Badge>
        )}
        <span className="text-sm text-dark-400">
          Позиция: {step.position}
        </span>
        {step.cost !== undefined && step.cost !== null && (
          <span className="text-sm font-medium text-primary-400">
            Стоимость: {step.cost}
          </span>
        )}
      </div>

      {renderBlockContent()}

      <div className="pt-4 border-t border-dark-700">
        <h4 className="text-sm font-semibold text-dark-200 mb-3">Информация о шаге</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-dark-800 rounded-lg border border-dark-600">
            <label className="block text-xs font-medium text-dark-400 mb-1">Дата создания</label>
            <p className="text-sm text-dark-100 font-medium">
              {step.createdAt 
                ? new Date(step.createdAt).toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Не указано'}
            </p>
          </div>
          <div className="p-3 bg-dark-800 rounded-lg border border-dark-600">
            <label className="block text-xs font-medium text-dark-400 mb-1">Дата обновления</label>
            <p className="text-sm text-dark-100 font-medium">
              {step.updatedAt 
                ? new Date(step.updatedAt).toLocaleString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Не указано'}
            </p>
          </div>
        </div>
      </div>

      {blockData && (
        <details className="mt-4">
          <summary className="text-sm font-medium text-dark-400 cursor-pointer hover:text-dark-300">
            Показать данные шага (JSON)
          </summary>
          <div className="mt-2 w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 max-h-[300px] overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap break-words">
              {JSON.stringify(blockData, null, 2)}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}

