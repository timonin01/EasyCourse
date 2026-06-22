import { useEffect, useState } from 'react';
import { FileDown } from 'lucide-react';
import { Modal, Button, Checkbox } from '../ui';

export interface CourseAuditPdfExportOptions {
  includeReport: boolean;
  includeImprovements: boolean;
  includeNewContent: boolean;
}

interface CourseAuditPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: CourseAuditPdfExportOptions) => Promise<void>;
  isExporting: boolean;
}

const defaultOptions: CourseAuditPdfExportOptions = {
  includeReport: true,
  includeImprovements: true,
  includeNewContent: true,
};

export function CourseAuditPdfExportModal({
  isOpen,
  onClose,
  onExport,
  isExporting,
}: CourseAuditPdfExportModalProps) {
  const [options, setOptions] = useState<CourseAuditPdfExportOptions>(defaultOptions);

  useEffect(() => {
    if (isOpen) {
      setOptions(defaultOptions);
    }
  }, [isOpen]);

  const hasSelection =
    options.includeReport || options.includeImprovements || options.includeNewContent;

  const handleExport = async () => {
    if (!hasSelection) return;
    await onExport(options);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Скачать PDF"
      subtitle="Выберите разделы отчёта для экспорта"
      icon={<FileDown className="h-5 w-5" />}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            Отмена
          </Button>
          <Button
            icon={<FileDown className="h-4 w-4" />}
            onClick={() => void handleExport()}
            disabled={!hasSelection || isExporting}
          >
            {isExporting ? 'Формирование...' : 'Скачать PDF'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Checkbox
          checked={options.includeReport}
          onChange={(checked) => setOptions((prev) => ({ ...prev, includeReport: checked }))}
          label="Отчёт"
          description="Краткий итог и план внедрения"
          variant="primary"
        />
        <Checkbox
          checked={options.includeImprovements}
          onChange={(checked) => setOptions((prev) => ({ ...prev, includeImprovements: checked }))}
          label="Доработка курса"
          description="Улучшения существующих уроков"
          variant="primary"
        />
        <Checkbox
          checked={options.includeNewContent}
          onChange={(checked) => setOptions((prev) => ({ ...prev, includeNewContent: checked }))}
          label="Новый контент"
          description="Новые модули и уроки"
          variant="primary"
        />
      </div>
    </Modal>
  );
}
