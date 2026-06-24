import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  Trash2,
  Upload,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Course } from '../../types';
import { Card, Badge, Button } from '../ui';

interface CourseCardProps {
  course: Course;
  variant?: 'compact' | 'detailed';
  onEdit?: (course: Course) => void;
  onDelete?: (courseId: number) => void;
  onSync?: (courseId: number) => void;
  onViewDetails?: (course: Course) => void;
  onOpen?: (courseId: number) => void;
}

export function CourseCard({
  course,
  variant = 'compact',
  onEdit,
  onDelete,
  onSync,
  onViewDetails,
  onOpen,
}: CourseCardProps) {
  const hasStepikId = Boolean(course.stepikCourseId);
  // Полностью синхронизирован, только если бэкенд это подтвердил.
  // Для старых данных без флага считаем по наличию stepikCourseId.
  const fullySynced = course.fullySynced ?? hasStepikId;
  // На Stepik, но часть модулей/уроков/шагов ещё не выгружена.
  const partiallySynced = hasStepikId && !fullySynced;

  const hoverLiftClass =
    'transition-all duration-200 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]';

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
          {fullySynced ? (
            <a
              href={`https://stepik.org/course/${course.stepikCourseId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge variant="success" className="flex cursor-pointer items-center gap-1 hover:bg-green-500/30">
                <CheckCircle className="h-3 w-3" />
                #{course.stepikCourseId}
                <ExternalLink className="h-3 w-3" />
              </Badge>
            </a>
          ) : partiallySynced ? (
            <a
              href={`https://stepik.org/course/${course.stepikCourseId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Курс выгружен, но часть содержимого ещё не на Stepik"
            >
              <Badge variant="warning" className="flex cursor-pointer items-center gap-1 hover:bg-amber-500/30">
                <AlertTriangle className="h-3 w-3" />
                Не полностью
                <ExternalLink className="h-3 w-3" />
              </Badge>
            </a>
          ) : (
            <span title="Курс ещё не выгружен на Stepik">
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Не синхронизирован
              </Badge>
            </span>
          )}
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
              {onViewDetails && (
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(course)} title="Детали">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(course)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onSync && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSync(course.id)}
                  title={hasStepikId ? 'Обновить в Stepik' : 'Синхронизировать'}
                  className={fullySynced ? 'text-green-400 hover:text-green-300' : partiallySynced ? 'text-amber-400 hover:text-amber-300' : ''}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(course.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-primary-400">Открыть →</span>
          )}
        </div>
      </div>
    </>
  );

  if (variant === 'compact') {
    return (
      <Link to={`/courses/${course.id}`}>
        <Card hover className={clsx('relative h-full overflow-hidden', hoverLiftClass)}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card
      hover={Boolean(onOpen)}
      className={clsx('relative flex h-full min-w-0 flex-col', onOpen && hoverLiftClass)}
      onClick={onOpen ? () => onOpen(course.id) : undefined}
    >
      {cardContent}
    </Card>
  );
}
