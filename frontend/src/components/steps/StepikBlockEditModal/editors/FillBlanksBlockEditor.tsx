import { Trash2, FileText, TextCursorInput, ListChecks, Settings2 } from 'lucide-react';
import { FormSection, OptionCard, AddButton, Toggle, Checkbox } from '../../../ui';
import type { FillBlanksEditData } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface FillBlanksBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  fillBlanks: FillBlanksEditData;
  onFillBlanksChange: (data: FillBlanksEditData | ((prev: FillBlanksEditData) => FillBlanksEditData)) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function FillBlanksBlockEditor({
  text,
  onTextChange,
  fillBlanks,
  onFillBlanksChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: FillBlanksBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={4} placeholder="Введите описание задания..." />
      <FormSection title="Настройки" icon={<Settings2 className="w-4 h-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Toggle checked={fillBlanks.isCaseSensitive} onChange={(v) => onFillBlanksChange((p) => ({ ...p, isCaseSensitive: v }))} label="Учитывать регистр" description="Ответ должен точно совпадать по регистру" size="sm" />
          <Toggle checked={fillBlanks.isDetailedFeedback} onChange={(v) => onFillBlanksChange((p) => ({ ...p, isDetailedFeedback: v }))} label="Детальный фидбэк" description="Показывать подробную информацию" size="sm" />
          <Toggle checked={fillBlanks.isPartiallyCorrect} onChange={(v) => onFillBlanksChange((p) => ({ ...p, isPartiallyCorrect: v }))} label="Частичные баллы" description="Начислять баллы за часть ответов" size="sm" />
        </div>
      </FormSection>
      <FormSection title="Компоненты" icon={<ListChecks className="w-4 h-4" />} description="Текстовые фрагменты и пропуски для заполнения" variant="highlight">
        <div className="space-y-3">
          {fillBlanks.components.map((c, i) => (
            <OptionCard
              key={i}
              onDelete={() => {
                const next = fillBlanks.components.filter((_, j) => j !== i);
                onFillBlanksChange((p) => ({ ...p, components: next.length ? next : [{ type: 'text', text: '', options: [] }] }));
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
                      onFillBlanksChange((p) => ({ ...p, components: next }));
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
                      onFillBlanksChange((p) => ({ ...p, components: next }));
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
                            onFillBlanksChange((p) => ({ ...p, components: next }));
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
                            onFillBlanksChange((p) => ({ ...p, components: next }));
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
                              onFillBlanksChange((p) => ({ ...p, components: next }));
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
                              onFillBlanksChange((p) => ({ ...p, components: next }));
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
                              onFillBlanksChange((p) => ({ ...p, components: next }));
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
                          onFillBlanksChange((p) => ({ ...p, components: next }));
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
          <AddButton variant="default" icon={<FileText className="w-4 h-4" />} onClick={() => onFillBlanksChange((p) => ({ ...p, components: [...p.components, { type: 'text', text: '', options: [] }] }))}>
            Добавить текст
          </AddButton>
          <AddButton variant="default" icon={<TextCursorInput className="w-4 h-4" />} onClick={() => onFillBlanksChange((p) => ({ ...p, components: [...p.components, { type: 'blank', text: '', options: [], inputType: 'input' }] }))}>
            Добавить пропуск
          </AddButton>
        </div>
      </FormSection>
      <FeedbackSection
        feedbackCorrect={feedbackCorrect}
        feedbackWrong={feedbackWrong}
        onFeedbackCorrectChange={onFeedbackCorrectChange}
        onFeedbackWrongChange={onFeedbackWrongChange}
      />
    </>
  );
}
