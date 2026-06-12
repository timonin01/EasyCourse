import { Input } from '../../../components/ui';

interface StepMetaFieldsProps {
  title: string;
  cost: string;
  onTitleChange: (v: string) => void;
  onCostChange: (v: string) => void;
}

export function StepMetaFields({ title, cost, onTitleChange, onCostChange }: StepMetaFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-dark-800/50 border border-dark-600">
      <Input
        label="Название"
        placeholder="Введите название шага"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <Input
        label="Стоимость"
        type="number"
        placeholder="Стоимость"
        value={cost}
        onChange={(e) => onCostChange(e.target.value)}
      />
    </div>
  );
}
