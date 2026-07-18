import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Edit,
  ExternalLink,
  Trash2,
  Upload,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Course } from '../../types';
import { Card, Badge, Button, Modal, Tooltip } from '../ui';
import { sectionsApi } from '../../api';
import { useCourseStore } from '../../store';

interface CourseCardProps {
  course: Course;
  variant?: 'compact' | 'detailed';
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: number) => void;
  onSync?: (courseId: number) => void;
  onOpen?: (courseId: number) => void;
}

function stepikCourseUrl(stepikCourseId: number | string) {
  return `https://stepik.org/course/${stepikCourseId}`;
}

export function CourseCard({
  course,
  variant = 'compact',
  onEdit,
  onDelete,
  onSync,
  onOpen,
}: CourseCardProps) {
  const [isStepikModalOpen, setIsStepikModalOpen] = useState(false);
  const hasStepikId = Boolean(course.stepikCourseId);
  // Полностью синхронизирован, только если бэкенд это подтвердил.
  // Для старых данных без флага считаем по наличию stepikCourseId.
  const fullySynced = course.fullySynced ?? hasStepikId;
  // На Stepik, но часть модулей/уроков/шагов ещё не выгружена.
  const partiallySynced = hasStepikId && !fullySynced;

  const prepareEditor = () => {
    useCourseStore.getState().setSelectedCourse(course);
    void sectionsApi.getCourseSections(course.id).then((sections) => {
      const state = useCourseStore.getState();
      if (state.selectedCourse?.id === course.id) {
        state.setModels(sections);
        state.saveSyncedModelPositions(sections);
      }
    }).catch(() => {
      // loadCourse в редакторе повторит запрос
    });
  };

  const openStepik = () => {
    if (!course.stepikCourseId) return;
    window.open(stepikCourseUrl(course.stepikCourseId), '_blank', 'noopener,noreferrer');
  };

  const handleStepikBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fullySynced) {
      openStepik();
      return;
    }
    if (partiallySynced) {
      setIsStepikModalOpen(true);
    }
  };

  const handleSyncFromModal = () => {
    setIsStepikModalOpen(false);
    onSync?.(course.id);
  };

  const handleOpenStepikFromModal = () => {
    setIsStepikModalOpen(false);
    openStepik();
  };

  const syncStatusBadge = fullySynced ? (
    <button
      type="button"
      onClick={handleStepikBadgeClick}
      className="shrink-0"
      title={`Открыть на Stepik · ID ${course.stepikCourseId}`}
    >
      <Badge variant="success" className="flex cursor-pointer items-center gap-1 hover:bg-green-500/30">
        <CheckCircle className="h-3 w-3" />
        Открыть на Stepik
        <ExternalLink className="h-3 w-3" />
      </Badge>
    </button>
  ) : partiallySynced ? (
    <button
      type="button"
      onClick={handleStepikBadgeClick}
      className="shrink-0"
      title="Курс на Stepik, но часть содержимого ещё не выгружена"
    >
      <Badge variant="warning" className="flex cursor-pointer items-center gap-1 hover:bg-amber-500/30">
        <AlertTriangle className="h-3 w-3" />
        Не полностью синхронизирован
        <ExternalLink className="h-3 w-3" />
      </Badge>
    </button>
  ) : (
    <span title="Курс ещё не выгружен на Stepik" className="shrink-0">
      <Badge variant="warning" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Не синхронизирован
      </Badge>
    </span>
  );

  const cardContent = (
    <>
      <div
        className={clsx(
          'absolute left-0 top-0 h-full w-1 rounded-l-xl',
          fullySynced ? 'bg-green-500' : 'bg-amber-500/80'
        )}
      />
      <div className="pl-3 flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div
            className={clsx(
              'rounded-lg p-2',
              fullySynced
                ? 'bg-green-500/15'
                : partiallySynced
                  ? 'bg-amber-500/15'
                  : 'bg-primary-600/15'
            )}
          >
            {fullySynced ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : partiallySynced ? (
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            ) : (
              <BookOpen className="h-5 w-5 text-primary-400" />
            )}
          </div>
          {syncStatusBadge}
        </div>

        <h3 className="mb-1 line-clamp-1 font-semibold text-dark-100">{course.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-dark-400">{course.description}</p>

        <div
          className={clsx(
            'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
            variant === 'detailed' ? 'mt-auto border-t border-dark-700 pt-4' : 'mt-4'
          )}
        >
          <p className="shrink-0 text-xs text-dark-500">
            {new Date(course.updatedAt).toLocaleDateString('ru-RU')}
          </p>

          {variant === 'detailed' ? (
            <div className="flex flex-wrap items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (onOpen ? onOpen(course.id) : undefined)}
              >
                Открыть
              </Button>
              {onEdit && (
                <Tooltip label="Редактировать" side="top">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(course)} aria-label="Редактировать">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Tooltip>
              )}
              {onSync && (
                <Tooltip
                  label={hasStepikId ? 'Обновить в Stepik' : 'Синхронизировать'}
                  side="top"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSync(course.id)}
                    aria-label={hasStepikId ? 'Обновить в Stepik' : 'Синхронизировать'}
                    className={fullySynced ? 'text-green-400 hover:text-green-300' : partiallySynced ? 'text-amber-400 hover:text-amber-300' : ''}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip label="Удалить" side="top">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(course.id)}
                    aria-label="Удалить"
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Tooltip>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-primary-400">Открыть →</span>
          )}
        </div>
      </div>
    </>
  );

  const stepikModal = (
    <Modal
      isOpen={isStepikModalOpen}
      onClose={() => setIsStepikModalOpen(false)}
      title="Курс синхронизирован не полностью"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-dark-400">
          Курс уже есть на Stepik, но часть модулей, уроков или шагов ещё не выгружена.
          Можно досинхронизировать сейчас или открыть текущую версию на Stepik.
        </p>
        {course.stepikCourseId && (
          <p className="text-xs text-dark-500">Stepik ID: {course.stepikCourseId}</p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={handleOpenStepikFromModal} icon={<ExternalLink className="h-4 w-4" />}>
            Перейти на Stepik
          </Button>
          {onSync ? (
            <Button onClick={handleSyncFromModal} icon={<Upload className="h-4 w-4" />}>
              Синхронизировать
            </Button>
          ) : (
            <Link to="/stepik-sync" onClick={() => setIsStepikModalOpen(false)}>
              <Button className="w-full sm:w-auto" icon={<Upload className="h-4 w-4" />}>
                Синхронизировать
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );

  const hoverCardClass =
    'relative h-full transition-[transform,border-color] duration-150 hover:z-10 hover:scale-[1.02]';

  if (variant === 'compact') {
    return (
      <>
        <Link
          to={`/courses/${course.id}`}
          onClick={prepareEditor}
          className="block h-full transition-transform duration-150 hover:z-10 hover:scale-[1.02]"
        >
          <Card hover className="relative h-full">
            {cardContent}
          </Card>
        </Link>
        {stepikModal}
      </>
    );
  }

  return (
    <>
      <Card
        hover={Boolean(onOpen)}
        className={clsx(hoverCardClass, 'flex min-w-0 flex-col')}
        onClick={onOpen ? () => onOpen(course.id) : undefined}
      >
        {cardContent}
      </Card>
      {stepikModal}
    </>
  );
}
