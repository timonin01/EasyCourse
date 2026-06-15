import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export function PasswordInput({ icon, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      {...props}
      icon={icon}
      type={showPassword ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="inline-flex items-center justify-center p-0 border-0 bg-transparent text-dark-500 hover:text-dark-300 transition-colors leading-none"
          aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      }
    />
  );
}
