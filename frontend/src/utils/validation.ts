export const FIELD_LIMITS = {
  userName: { min: 1, max: 100 },
  title: { min: 1, max: 64 },
  email: { max: 100 },
  password: { min: 6, max: 100 },
} as const;

export function validateUserName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Имя не может быть пустым';
  }
  if (trimmed.length < FIELD_LIMITS.userName.min) {
    return `Имя должно быть не короче ${FIELD_LIMITS.userName.min} символов`;
  }
  if (trimmed.length > FIELD_LIMITS.userName.max) {
    return `Имя не должно превышать ${FIELD_LIMITS.userName.max} символов`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email не может быть пустым';
  }
  if (trimmed.length > FIELD_LIMITS.email.max) {
    return `Email не должен превышать ${FIELD_LIMITS.email.max} символов`;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return 'Некорректный формат email';
  }
  return null;
}

export function validateTitle(title: string, label = 'Название'): string | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return `${label} не может быть пустым`;
  }
  if (trimmed.length < FIELD_LIMITS.title.min) {
    return `${label} должно быть не короче ${FIELD_LIMITS.title.min} символов`;
  }
  if (trimmed.length > FIELD_LIMITS.title.max) {
    return `${label} не должно превышать ${FIELD_LIMITS.title.max} символов`;
  }
  return null;
}
