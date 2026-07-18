import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Settings, Sparkles } from 'lucide-react';
import { Card, Button } from '../ui';
import { ONBOARDING_STEPS } from '../../constants/productInfo';
import { STEPIK_OAUTH_SETTINGS_PATH } from '../../constants/settingsSections';

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
        <Link to={STEPIK_OAUTH_SETTINGS_PATH}>
          <Button variant="secondary" icon={<Settings className="w-4 h-4" />}>
            Настроить Stepik
          </Button>
        </Link>
        <Link to="/ai-generator">
          <Button
            variant="secondary"
            icon={<Sparkles className="w-4 h-4" />}
            className="border-purple-500/40 bg-purple-600/20 text-purple-100 shadow-lg shadow-purple-950/20 hover:border-purple-400/60 hover:bg-purple-600/30 hover:text-white"
          >
            Попробовать генерацию шагов
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
