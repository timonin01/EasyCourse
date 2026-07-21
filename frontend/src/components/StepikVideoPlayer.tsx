import {
  formatVideoDuration,
  getStepikVideoPlaybackUrl,
  parseStepikVideoSource,
} from '../utils/stepikVideo';

interface StepikVideoPlayerProps {
  video: unknown;
  className?: string;
}

export function StepikVideoPlayer({ video, className }: StepikVideoPlayerProps) {
  const source = parseStepikVideoSource(video);
  const playbackUrl = getStepikVideoPlaybackUrl(video);
  const durationLabel = formatVideoDuration(source?.duration);

  if (!playbackUrl) {
    const status = source?.status;
    if (status && status !== 'ready') {
      return (
        <div className={className ?? 'rounded-xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-dark-400'}>
          Видео обрабатывается на Stepik ({status})…
        </div>
      );
    }
    return (
      <div className={className ?? 'rounded-xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-dark-400'}>
        Видео недоступно
      </div>
    );
  }

  return (
    <div className={className ?? 'space-y-2'}>
      <video
        controls
        preload="metadata"
        poster={source?.thumbnail || undefined}
        className="w-full rounded-xl border border-dark-600 bg-black"
        src={playbackUrl}
      >
        Ваш браузер не поддерживает воспроизведение видео.
      </video>
      {(durationLabel || source?.filename) && (
        <p className="text-xs text-dark-500">
          {[source?.filename, durationLabel].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}
