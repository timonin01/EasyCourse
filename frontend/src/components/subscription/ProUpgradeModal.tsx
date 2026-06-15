import { Bot, Crown, Layers, RefreshCw, Sparkles } from 'lucide-react';
import { Modal, Button, Badge } from '../ui';
import { PRO_LLM_MODEL_LABELS } from '../../constants/llmModels';
import { PRO_MAX_BATCH_STEPS } from '../../constants/subscription';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  {
    icon: Sparkles,
    title: 'Безлимитные AI-генерации',
    description: 'Без месячного лимита на генерации контента',
  },
  {
    icon: Bot,
    title: 'Все модели AI',
    description: PRO_LLM_MODEL_LABELS.join(', '),
  },
  {
    icon: Layers,
    title: 'Расширенная batch-генерация',
    description: `До ${PRO_MAX_BATCH_STEPS} шагов за один запрос`,
  },
  {
    icon: RefreshCw,
    title: 'Смена типа шага',
    description: 'Конвертация типа шага с помощью AI',
  },
];

export function ProUpgradeModal({ isOpen, onClose }: ProUpgradeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Подписка Pro"
      subtitle="Расширенные возможности для создания курсов"
      icon={<Crown className="h-5 w-5" />}
      size="md"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Позже
          </Button>
          <Button
            icon={<Sparkles className="h-4 w-4" />}
            onClick={() => {
              window.open('mailto:support@easycourse.ru?subject=Подписка%20Pro', '_blank');
              onClose();
            }}
          >
            Узнать о Pro
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex gap-3 rounded-xl border border-dark-700/80 bg-dark-800/50 p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-400">
              <feature.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark-100">{feature.title}</p>
              <p className="text-xs text-dark-400 mt-0.5">{feature.description}</p>
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-primary-500/20 bg-primary-900/20 px-3 py-2.5 text-center">
          <Badge variant="success" className="mb-2">
            Pro
          </Badge>
          <p className="text-xs text-dark-300">
            Оплата и активация — напишите нам, поможем подключить подписку
          </p>
        </div>
      </div>
    </Modal>
  );
}
