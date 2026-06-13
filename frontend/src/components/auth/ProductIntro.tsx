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
        <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">EasyCourse</h1>
          <p className="text-sm text-dark-400">{PRODUCT_TAGLINE}</p>
        </div>
      </div>

      <p className="text-dark-300 leading-relaxed mb-8">{PRODUCT_DESCRIPTION}</p>

      <ul className="space-y-4">
        {PRODUCT_FEATURES.map((feature) => (
          <li key={feature.title} className="flex gap-3">
            <div className="p-2 rounded-lg bg-dark-800 text-primary-400 flex-shrink-0 h-fit">
              <feature.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-dark-100">{feature.title}</p>
              <p className="text-sm text-dark-400">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
