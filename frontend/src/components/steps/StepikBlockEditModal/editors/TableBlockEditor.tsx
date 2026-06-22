import { Trash2, CheckCircle, Columns, Rows } from 'lucide-react';
import { FormSection, AddButton } from '../../../ui';
import type { TableEditData } from '../types';
import { ConditionSection } from '../sections/ConditionSection';
import { FeedbackSection } from '../sections/FeedbackSection';

interface TableBlockEditorProps {
  text: string;
  onTextChange: (value: string) => void;
  tableData: TableEditData;
  onTableDataChange: (data: TableEditData | ((prev: TableEditData) => TableEditData)) => void;
  feedbackCorrect: string;
  feedbackWrong: string;
  onFeedbackCorrectChange: (value: string) => void;
  onFeedbackWrongChange: (value: string) => void;
}

export function TableBlockEditor({
  text,
  onTextChange,
  tableData,
  onTableDataChange,
  feedbackCorrect,
  feedbackWrong,
  onFeedbackCorrectChange,
  onFeedbackWrongChange,
}: TableBlockEditorProps) {
  return (
    <>
      <ConditionSection text={text} onTextChange={onTextChange} rows={4} placeholder="Опишите задание для студента..." />
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
                  onTableDataChange((p) => ({ ...p, columnNames: next }));
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
                  onTableDataChange({ columnNames: cols, rows });
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
          onClick={() => onTableDataChange((p) => ({ columnNames: [...p.columnNames, ''], rows: p.rows.map((r) => ({ ...r, columns: [...r.columns, false] })) }))}
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
                  onTableDataChange((p) => ({ ...p, rows: next }));
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
                        onTableDataChange((p) => ({ ...p, rows: next }));
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
                  onTableDataChange((p) => ({ ...p, rows: next.length ? next : [{ name: '', columns: p.columnNames.map(() => false) }] }));
                }}
                className="w-8 p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <AddButton variant="dashed" fullWidth className="mt-3" icon={<Rows className="w-4 h-4" />} onClick={() => onTableDataChange((p) => ({ ...p, rows: [...p.rows, { name: '', columns: p.columnNames.map(() => false) }] }))}>
          Добавить строку
        </AddButton>
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
