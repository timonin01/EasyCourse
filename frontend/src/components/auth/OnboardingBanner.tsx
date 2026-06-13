import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Settings } from 'lucide-react';
import { Card, Button } from '../ui';
import { ONBOARDING_STEPS } from '../../constants/productInfo';

export function OnboardingBanner() {
  return (
    <Card className="mb-8 border-primary-600/20 bg-primary-600/5">
      <h2 className="text-lg font-semibold text-dark-100 mb-1">Добро пожаловать в EasyCourse!</h2>
      <p className="text-sm text-dark-400 mb-6">
        Редактор курсов для Stepik с AI-генерацией. Вот с чего начать:
      </p>

      <ol className="space-y-4 mb-6">
        {ONBOARDING_STEPS.map((item) => (
          <li key={item.step} className="flex gap-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600/20 text-primary-400 text-sm font-semibold flex items-center justify-center">
              {item.step}
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
