import { useState, useEffect } from 'react';
import { Button, Card, Badge, Checkbox } from '../../../components/ui';
import { Save, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import type { StepikBlockRequest } from '../../../types';

interface BatchResult {
  step: StepikBlockRequest;
  index: number;
  error?: string;
}

interface BatchResultsPreviewProps {
  results: BatchResult[];
  onSaveSelected: (selectedIndices: number[]) => void;
  onSaveAll: () => void;
  isSaving: boolean;
  selectedLessonId: number | null;
}

export function BatchResultsPreview({
  results,
  onSaveSelected,
  onSaveAll,
  isSaving,
  selectedLessonId,
}: BatchResultsPreviewProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [resultsHash, setResultsHash] = useState<string>('');

  // Синхронизируем selectedIndices при изменении results
  // Автоматически выбираем все успешные результаты только при первой загрузке
  useEffect(() => {
    const successfulIndices = new Set(results.filter((r) => !r.error).map((r) => r.index));
    const currentHash = results.map(r => `${r.index}:${!!r.error}`).join(',');
    
    // Проверяем, изменился ли набор results (по хешу)
    if (currentHash !== resultsHash) {
      setResultsHash(currentHash);
      
      setSelectedIndices((prev) => {
        // Если это первая загрузка (prev пустой), выбираем все успешные
        if (prev.size === 0 && successfulIndices.size > 0) {
          return successfulIndices;
        }
        // Иначе сохраняем текущий выбор, но удаляем индексы, которых больше нет в results
        const filtered = new Set<number>();
        prev.forEach((idx) => {
          if (successfulIndices.has(idx)) {
            filtered.add(idx);
          }
        });
        return filtered;
      });
    }
  }, [results, resultsHash]);

  const toggleSelection = (index: number, checked: boolean) => {
    setSelectedIndices((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(index);
      } else {
        newSelected.delete(index);
      }
      return newSelected;
    });
  };

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const successfulResults = results.filter((r) => !r.error);
  const failedResults = results.filter((r) => r.error);

  const handleSaveSelected = () => {
    onSaveSelected(Array.from(selectedIndices));
  };

  if (!selectedLessonId) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-yellow-400">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm">Выберите урок для сохранения шагов</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-dark-200">{results.length}</div>
          <div className="text-sm text-dark-400">Всего шагов</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-400">{successfulResults.length}</div>
          <div className="text-sm text-dark-400">Успешно</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-400">{failedResults.length}</div>
          <div className="text-sm text-dark-400">Ошибок</div>
        </Card>
      </div>

      {/* Кнопки сохранения */}
      <div className="flex gap-2">
        <Button
          onClick={onSaveAll}
          disabled={isSaving || successfulResults.length === 0}
          isLoading={isSaving}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Сохранить все ({successfulResults.length})
        </Button>
        <Button
          onClick={handleSaveSelected}
          disabled={isSaving || selectedIndices.size === 0}
          isLoading={isSaving}
          variant="secondary"
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Сохранить выбранные ({selectedIndices.size})
        </Button>
      </div>

      {/* Список результатов */}
      <div className="space-y-3">
        {results.map((result) => {
          const isSelected = selectedIndices.has(result.index);
          const isExpanded = expandedSteps.has(result.index);
          const hasError = !!result.error;

          return (
            <Card key={result.index} className="p-4 border-2" padding="none">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked) => toggleSelection(result.index, checked)}
                      disabled={hasError}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={hasError ? 'danger' : 'success'}>
                          Шаг #{result.index + 1}
                        </Badge>
                        <Badge>{result.step.name || 'unknown'}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(result.index)}
                  >
                    {isExpanded ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Ошибка */}
                {hasError && (
                  <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Ошибка генерации</span>
                    </div>
                    <div className="text-sm text-red-300 whitespace-pre-wrap break-words">
                      {result.error?.split('\n').map((line, idx) => (
                        <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
                          {line}
                        </div>
                      ))}
                    </div>
                    {result.error && result.error.includes('Детали:') && (
                      <div className="mt-2 pt-2 border-t border-red-500/20">
                        <p className="text-xs text-red-400 italic">
                          Подробности ошибки показаны выше. Проверьте формат ответа от LLM.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Контент */}
                {!hasError && (
                  <div>
                    {isExpanded ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-dark-400 mb-2">Текст:</h4>
                          <div
                            className="text-sm text-dark-200 bg-dark-800 p-3 rounded-lg prose prose-sm prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: result.step.text || '' }}
                          />
                        </div>

                        {result.step.source != null && (
                          <div>
                            <h4 className="text-sm font-medium text-dark-400 mb-2">Данные:</h4>
                            <pre className="text-xs text-dark-400 bg-dark-800 p-3 rounded-lg overflow-auto max-h-60">
                              {JSON.stringify(result.step.source, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-dark-300 line-clamp-2">
                        {result.step.text?.replace(/<[^>]*>/g, '').substring(0, 150) || 'Нет текста'}...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
