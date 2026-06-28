import { GraduationCap } from 'lucide-react';
import { PRODUCT_DESCRIPTION, PRODUCT_FEATURES, PRODUCT_TAGLINE } from '../../constants/productInfo';

interface ProductIntroProps {
  compact?: boolean;
}

export function ProductIntro({ compact = false }: ProductIntroProps) {
  if (compact) {
    return (
      <div className="text-center mb-6">
        <p className="text-sm text-dark-400 leading-relaxed">{PRODUCT_DESCRIPTION}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center h-full p-8 lg:p-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-dark-100">EasyCourse</h1>
          <p className="text-sm text-dark-400">{PRODUCT_TAGLINE}</p>
        </div>
      </div>

      <p className="text-dark-300 leading-relaxed mb-8">{PRODUCT_DESCRIPTION}</p>

      <ul className="space-y-3">
        {PRODUCT_FEATURES.map((feature) => (
          <li key={feature.title} className="flex gap-3">
            <feature.icon className="w-4 h-4 text-dark-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-dark-200">{feature.title}</p>
              <p className="text-sm text-dark-400">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
