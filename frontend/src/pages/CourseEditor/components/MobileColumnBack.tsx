import { ChevronLeft } from 'lucide-react';

interface MobileColumnBackProps {
  label: string;
  onBack: () => void;
}

export function MobileColumnBack({ label, onBack }: MobileColumnBackProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 flex w-full items-center gap-2 rounded-lg border border-dark-700/60 bg-dark-850 px-3 py-2 text-left text-sm text-dark-300 transition-colors hover:border-dark-600 hover:text-dark-100 lg:hidden"
    >
      <ChevronLeft className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
