import { useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

export function useCollapsibleSidePanel(breakpoint = '(min-width: 1280px)') {
  const isDesktop = useMediaQuery(breakpoint);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setIsOpen(false);
    }
  }, [isDesktop]);

  return {
    isDesktop,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((value) => !value),
  };
}
