import { useCallback, useState, type MouseEvent as ReactMouseEvent } from 'react';

interface UseResizableWidthOptions {
  storageKey: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

function readStoredWidth(
  storageKey: string,
  defaultWidth: number,
  minWidth: number,
  maxWidth: number
): number {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return defaultWidth;

    const parsed = Number(stored);
    if (Number.isNaN(parsed)) return defaultWidth;

    return Math.min(maxWidth, Math.max(minWidth, parsed));
  } catch {
    return defaultWidth;
  }
}

export function useResizableWidth({
  storageKey,
  defaultWidth,
  minWidth = 240,
  maxWidth = 640,
}: UseResizableWidthOptions) {
  const [width, setWidth] = useState(() =>
    readStoredWidth(storageKey, defaultWidth, minWidth, maxWidth)
  );
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();

      const startX = event.clientX;
      const startWidth = width;

      setIsResizing(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = startX - moveEvent.clientX;
        const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));
        setWidth(nextWidth);
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        const delta = startX - upEvent.clientX;
        const finalWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));

        setWidth(finalWidth);
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        try {
          localStorage.setItem(storageKey, String(finalWidth));
        } catch {
          // ignore storage errors
        }

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [width, minWidth, maxWidth, storageKey]
  );

  return { width, isResizing, startResize };
}
