import { Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal, Button } from '../../../components/ui';
import { StepikIcon } from '../../../components/StepikIcon';
import { coursesApi, stepikApi } from '../../../api';
import type { Course } from '../../../types';

interface DeleteResult {
  success: string[];
  errors: string[];
}

interface DeleteCourseModalsProps {
  course: Course | null;
  isDeleteCourseModalOpen: boolean;
  onCloseDeleteCourseModal: () => void;
  isDeleteResultModalOpen: boolean;
  deleteResult: DeleteResult | null;
  onCloseDeleteResultModal: () => void;
  deletingItems: Set<number>;
  setDeletingItems: React.Dispatch<React.SetStateAction<Set<number>>>;
  setDeleteResult: React.Dispatch<React.SetStateAction<DeleteResult | null>>;
  setIsDeleteResultModalOpen: (open: boolean) => void;
  onNeedsRefresh: () => void;
}

export function DeleteCourseModals({
  course,
  isDeleteCourseModalOpen,
  onCloseDeleteCourseModal,
  isDeleteResultModalOpen,
  deleteResult,
  onCloseDeleteResultModal,
  deletingItems,
  setDeletingItems,
  setDeleteResult,
  setIsDeleteResultModalOpen,
  onNeedsRefresh,
}: DeleteCourseModalsProps) {
  const navigate = useNavigate();

  return (
    <>
      <Modal
        isOpen={isDeleteCourseModalOpen}
        onClose={onCloseDeleteCourseModal}
        title="Удаление курса"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-dark-200">
            Выберите тип удаления для курса <strong>&quot;{course?.title}&quot;</strong>:
          </p>

          {course?.stepikCourseId && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-400 mb-2">
                ⚠️ Внимание! Каскадное удаление со Stepik удалит:
              </p>
              <ul className="text-sm text-dark-300 list-disc list-inside space-y-1">
                <li>Курс и все его модули</li>
                <li>Все уроки в модулях</li>
                <li>Все шаги в уроках</li>
              </ul>
              <p className="text-xs text-dark-400 mt-2">
                Рекомендуется удалять сущности в порядке их позиций (1→2→3) для избежания проблем с позициями на Stepik.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={async () => {
                if (!course) return;
                if (!confirm(`Удалить курс "${course.title}" локально?`)) return;
                try {
                  await coursesApi.deleteCourse(course.id);
                  toast.success('Курс удален локально');
                  navigate('/courses');
                } catch {
                  toast.error('Ошибка удаления курса');
                } finally {
                  onCloseDeleteCourseModal();
                }
              }}
              disabled={!!course?.stepikCourseId}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить локально
              {course?.stepikCourseId && (
                <span className="ml-auto text-xs text-dark-500">(Сначала удалите со Stepik)</span>
              )}
            </Button>

            {course?.stepikCourseId && (
              <>
                <Button
                  variant="secondary"
                  className="w-full justify-start text-orange-400 hover:text-orange-300"
                  onClick={async () => {
                    if (!course) return;
                    const warningText = `Внимание! Будет удалено каскадно со Stepik: курс "${course.title}", все модули, уроки и шаги.\n\nРекомендуется удалять сущности в порядке их позиций (1→2→3) для избежания проблем с позициями на Stepik.\n\nПродолжить?`;
                    if (!confirm(warningText)) return;

                    setDeletingItems((prev) => new Set(prev).add(course.id));
                    const success: string[] = [];
                    const errors: string[] = [];

                    try {
                      await stepikApi.deleteCourseFromStepik(course.id);
                      success.push(`Курс "${course.title}" успешно удален со Stepik`);
                      toast.success('Курс удален со Stepik');
                      onNeedsRefresh();
                    } catch (error) {
                      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
                      errors.push(`Курс "${course.title}": ${errorMsg}`);
                      toast.error('Ошибка при удалении курса со Stepik');
                    } finally {
                      setDeletingItems((prev) => {
                        const next = new Set(prev);
                        next.delete(course.id);
                        return next;
                      });
                      onCloseDeleteCourseModal();
                      if (errors.length > 0 || success.length > 0) {
                        setDeleteResult({ success, errors });
                        setIsDeleteResultModalOpen(true);
                      }
                    }
                  }}
                  disabled={deletingItems.has(course?.id || 0)}
                >
                  <StepikIcon className="w-4 h-4 mr-2" size={16} />
                  Удалить со Stepik
                  {deletingItems.has(course?.id || 0) && (
                    <Loader2 className="w-4 h-4 ml-auto animate-spin" />
                  )}
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-start text-red-400 hover:text-red-300"
                  onClick={async () => {
                    if (!course) return;
                    const warningText = `ВНИМАНИЕ! Будет удалено ВЕЗДЕ (локально И со Stepik): курс "${course.title}", все модули, уроки и шаги.\n\nЭто действие нельзя отменить!\n\nПродолжить?`;
                    if (!confirm(warningText)) return;

                    setDeletingItems((prev) => new Set(prev).add(course.id));
                    const success: string[] = [];
                    const errors: string[] = [];

                    try {
                      if (course.stepikCourseId) {
                        try {
                          await stepikApi.deleteCourseFromStepik(course.id);
                          success.push(`Курс "${course.title}" удален со Stepik`);
                        } catch (error) {
                          const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
                          errors.push(`Ошибка удаления со Stepik: ${errorMsg}`);
                        }
                      }

                      try {
                        await coursesApi.deleteCourse(course.id);
                        success.push(`Курс "${course.title}" удален локально`);
                        toast.success('Курс удален везде');
                        navigate('/courses');
                      } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка';
                        errors.push(`Ошибка локального удаления: ${errorMsg}`);
                        toast.error('Ошибка при локальном удалении');
                      }
                    } finally {
                      setDeletingItems((prev) => {
                        const next = new Set(prev);
                        next.delete(course.id);
                        return next;
                      });
                      onCloseDeleteCourseModal();
                      if (errors.length > 0 || success.length > 0) {
                        setDeleteResult({ success, errors });
                        setIsDeleteResultModalOpen(true);
                      }
                    }
                  }}
                  disabled={deletingItems.has(course?.id || 0)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить везде
                  {deletingItems.has(course?.id || 0) && (
                    <Loader2 className="w-4 h-4 ml-auto animate-spin" />
                  )}
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-dark-700">
            <Button variant="ghost" onClick={onCloseDeleteCourseModal}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteResultModalOpen}
        onClose={onCloseDeleteResultModal}
        title="Результаты удаления"
        size="md"
      >
        {deleteResult && (
          <div className="space-y-4">
            {deleteResult.success.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">Успешно удалено:</h3>
                <ul className="text-sm text-dark-300 space-y-1">
                  {deleteResult.success.map((msg, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {deleteResult.errors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">Ошибки:</h3>
                <ul className="text-sm text-dark-300 space-y-1">
                  {deleteResult.errors.map((msg, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{msg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-dark-700">
              <Button variant="secondary" onClick={onCloseDeleteResultModal}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
