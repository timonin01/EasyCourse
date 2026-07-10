import { Link } from 'react-router-dom';
import { ArrowRight, Bot } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';

interface CourseAgentPromoCardProps {
  className?: string;
  hasCourses?: boolean;
}

export function CourseAgentPromoCard({ className, hasCourses = true }: CourseAgentPromoCardProps) {
  return (
    <Link to="/course-agent" className={clsx('group block', className)}>
      <div
        className={clsx(
          'relative overflow-hidden rounded-xl border border-purple-500/35 bg-dark-850',
          'transition-colors duration-150 hover:border-purple-400/50',
        )}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-purple-500/70"
          aria-hidden
        />

        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:pl-7">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-950/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-300">
                <Bot className="h-3 w-3" />
                Новинка
              </span>
              <span className="text-xs text-dark-500">AI-агент курса</span>
            </div>

            <h2 className="text-xl font-semibold text-dark-50 sm:text-2xl">
              Создавайте и дорабатывайте курс в диалоге
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dark-400 sm:text-base">
              {hasCourses
                ? 'Опишите задачу — агент спланирует модули, уроки и шаги, покажет план на подтверждение и создаст черновики. Можно править отдельные шаги и удалять лишнее.'
                : 'После создания первого курса агент поможет построить структуру, нагенерировать контент и доработать уроки по вашему запросу.'}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <Button
              variant="primary"
              size="md"
              className="pointer-events-none w-full sm:w-auto lg:min-w-[11rem]"
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="right"
            >
              Открыть агента
            </Button>
            <span className="text-center text-xs text-dark-500 lg:text-right">
              План → подтверждение → черновик
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
