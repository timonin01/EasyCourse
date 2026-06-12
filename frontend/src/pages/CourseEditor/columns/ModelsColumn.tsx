import { useState } from 'react';
import { Plus, Trash2, Upload, Loader2, Layers, CheckCircle, AlertTriangle, Pencil } from 'lucide-react';
import { Button, Card, SortableList } from '../../../components/ui';
import { StepikIcon } from '../../../components/StepikIcon';
import { EditTitleModal } from '../modals/EditTitleModal';
import type { Model } from '../../../types';

interface ModelsColumnProps {
  sections: Model[];
  selectedModel: Model | null;
  onSelectModel: (m: Model) => void;
  onAddClick: () => void;
  onReorder: (items: Model[]) => void;
  isUnsynced: (s: Model) => boolean;
  onSync: (id: number) => void;
  onDeleteLocal: (id: number) => void;
  onDeleteFromStepik: (id: number) => void;
  deletingItems: Set<number>;
  onUpdateTitle: (id: number, title: string) => Promise<void> | void;
}

export function ModelsColumn({
  sections,
  selectedModel,
  onSelectModel,
  onAddClick,
  onReorder,
  isUnsynced,
  onSync,
  onDeleteLocal,
  onDeleteFromStepik,
  deletingItems,
  onUpdateTitle,
}: ModelsColumnProps) {
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  const handleEditClick = (section: Model, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModel(section);
  };

  const handleSaveTitle = async (newTitle: string) => {
    if (editingModel) {
      await onUpdateTitle(editingModel.id, newTitle);
      setEditingModel(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-dark-200">Модули</h2>
        <Button size="sm" onClick={onAddClick}><Plus className="w-4 h-4" /></Button>
      </div>
      {sections.length > 0 ? (
        <SortableList
          items={sections}
          onReorder={onReorder}
          renderItem={(section) => {
            const modelUnsynced = isUnsynced(section);
            const borderColor = modelUnsynced
              ? 'border-l-2 border-l-orange-500'
              : section.stepikSectionId
                ? 'border-l-2 border-l-green-500'
                : 'border-l-2 border-l-yellow-500';
            return (
              <Card
                hover
                padding="sm"
                className={`${selectedModel?.id === section.id ? 'ring-2 ring-primary-500' : ''} ${borderColor}`}
                onClick={() => onSelectModel(section)}
              >
                <div className="flex items-center gap-2">
                  {modelUnsynced ? (
                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  ) : section.stepikSectionId ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <Layers className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <span className="flex-1 text-sm truncate" title={section.title}>
                        {section.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-1 text-dark-400 hover:text-dark-200"
                        onClick={(e) => handleEditClick(section, e)}
                        title="Редактировать название модуля"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {modelUnsynced && <span className="text-xs text-orange-400">Не синхр.</span>}
                  {section.stepikSectionId && !modelUnsynced && (
                    <span className="text-xs text-green-400">#{section.stepikSectionId}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-1 ${modelUnsynced ? 'text-orange-400 hover:text-orange-300' : section.stepikSectionId ? 'text-green-400 hover:text-green-300' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onSync(section.id); }}
                    title={modelUnsynced ? 'Синхронизировать изменения' : section.stepikSectionId ? 'Обновить в Stepik' : 'Синхронизировать'}
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 text-red-400"
                      disabled={deletingItems.has(section.id) || !!section.stepikSectionId}
                      onClick={() => onDeleteLocal(section.id)}
                      title={section.stepikSectionId ? 'Сначала удалите модуль со Stepik' : 'Удалить локально'}
                    >
                      {deletingItems.has(section.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                    {section.stepikSectionId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-orange-400 hover:text-orange-300"
                        disabled={deletingItems.has(section.id)}
                        onClick={() => onDeleteFromStepik(section.id)}
                        title="Удалить со Stepik (каскадно)"
                      >
                        {deletingItems.has(section.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : <StepikIcon className="w-3 h-3" size={12} />}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          }}
        />
      ) : (
        <p className="text-dark-500 text-sm text-center py-4">Нет модулей</p>
      )}

      {/* Модальное окно редактирования названия */}
      {editingModel && (
        <EditTitleModal
          isOpen={!!editingModel}
          onClose={() => setEditingModel(null)}
          currentTitle={editingModel.title}
          onSave={handleSaveTitle}
          label="модуля"
        />
      )}
    </div>
  );
}
