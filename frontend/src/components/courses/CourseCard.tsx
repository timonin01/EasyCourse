import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  RefreshCw,
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
  const isSynced = Boolean(course.stepikCourseId);

  const cardContent = (
    <>
      <div
        className={clsx(
          'absolute left-0 top-0 h-full w-1 rounded-l-xl',
          isSynced ? 'bg-green-500' : 'bg-amber-500/80'
        )}
      />
      <div className="pl-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div
            className={clsx(
              'rounded-lg p-2',
              isSynced ? 'bg-green-500/15' : 'bg-primary-600/15'
            )}
          >
            {isSynced ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <BookOpen className="h-5 w-5 text-primary-400" />
            )}
          </div>
          {isSynced ? (
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
          ) : (
            <Badge variant="warning">
              <RefreshCw className="mr-1 h-3 w-3" />
              Черновик
            </Badge>
          )}
        </div>

        <h3 className="mb-1 line-clamp-1 font-semibold text-dark-100">{course.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-dark-400">{course.description}</p>

        <div
          className={clsx(
            'mt-4 flex items-center justify-between gap-2',
            variant === 'detailed' && 'border-t border-dark-700 pt-4'
          )}
        >
          <p className="text-xs text-dark-500">
            {new Date(course.updatedAt).toLocaleDateString('ru-RU')}
          </p>

          {variant === 'detailed' ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                  title={isSynced ? 'Обновить в Stepik' : 'Синхронизировать'}
                  className={isSynced ? 'text-green-400 hover:text-green-300' : ''}
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
        <Card hover className="relative h-full overflow-hidden transition-transform hover:-translate-y-0.5">
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="relative flex h-full flex-col overflow-hidden">{cardContent}</Card>
  );
}
