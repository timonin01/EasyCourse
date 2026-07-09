import { AlertTriangle, Video } from 'lucide-react';
import { clsx } from 'clsx';

interface VideoStepsWarningBannerProps {
  className?: string;
}

export function VideoStepsWarningBanner({ className }: VideoStepsWarningBannerProps) {
  return (
    <div
      className={clsx(
        'flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3',
        className
      )}
      role="status"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
        <Video className="h-4 w-4 text-amber-400" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Видео-шаги — экспериментальная функция
        </p>
        <p className="mt-0.5 text-sm text-dark-400">
          При использовании видео в шагах возможны баги при редактировании и синхронизации со Stepik.
        </p>
      </div>
    </div>
  );
}
