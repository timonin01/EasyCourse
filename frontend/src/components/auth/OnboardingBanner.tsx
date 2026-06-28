import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Settings } from 'lucide-react';
import { Card, Button } from '../ui';
import { ONBOARDING_STEPS } from '../../constants/productInfo';

export function OnboardingBanner() {
  return (
    <Card className="mb-8">
      <h2 className="text-heading text-dark-100 mb-1">С чего начать</h2>
      <p className="text-caption text-dark-400 mb-5">
        Три шага до первого курса на Stepik
      </p>

      <ol className="space-y-3 mb-5">
        {ONBOARDING_STEPS.map((item) => (
          <li key={item.step} className="flex gap-3">
            <span className="flex-shrink-0 w-5 text-label font-medium text-dark-500 tabular-nums pt-0.5">
              {item.step}.
            </span>
            <div>
              <p className="text-sm font-medium text-dark-100">{item.title}</p>
              <p className="text-sm text-dark-400">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link to="/courses">
          <Button icon={<Plus className="w-4 h-4" />}>
            Создать первый курс
          </Button>
        </Link>
        <Link to="/settings">
          <Button variant="secondary" icon={<Settings className="w-4 h-4" />}>
            Настроить Stepik
          </Button>
        </Link>
        <Link to="/ai-generator">
          <Button variant="ghost" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
            Попробовать AI-генератор
          </Button>
        </Link>
      </div>
    </Card>
  );
}
