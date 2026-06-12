# EasyCourse Frontend

Современный фронтенд для платформы создания курсов EasyCourse.

## 🚀 Технологии

- **React 18** + **TypeScript**
- **Vite** - быстрый bundler
- **Tailwind CSS** - стилизация
- **React Router v6** - роутинг
- **Zustand** - state management
- **React Query** - кэширование API
- **Lucide React** - иконки
- **React Hot Toast** - уведомления

## 📦 Установка

```bash
# Перейти в папку frontend
cd frontend

# Установить зависимости
npm install
```

## 🏃 Запуск

### Development режим

```bash
npm run dev
```

Приложение запустится на `http://localhost:5173`

### Production build

```bash
npm run build
npm run preview
```

## 🔧 Конфигурация

Фронтенд настроен на работу с бэкендом через прокси:
- Все запросы на `/api/*` проксируются на `http://localhost:8080`
- Убедитесь, что бэкенд запущен на порту 8080

### Запуск бэкенда

```bash
# В корне проекта
cd app
./gradlew bootRun
```

Или через Docker:

```bash
cd app
docker-compose up -d
```

## 📱 Функционал

### Аутентификация
- Регистрация нового пользователя
- Вход в систему
- JWT авторизация

### Управление курсами
- Создание/редактирование/удаление курсов
- Модули (секции) курса
- Уроки внутри модулей
- Шаги (steps) внутри уроков

### AI Генератор
- Чат с ИИ для генерации контента
- Поддержка разных типов шагов:
  - Текстовые блоки
  - Тесты с выбором ответа
  - Сопоставление
  - Сортировка
  - Заполнение пропусков
  - Ввод строки/числа
  - Свободный ответ

### Stepik интеграция
- Настройка OAuth2 credentials
- Синхронизация курсов со Stepik
- Синхронизация модулей, уроков и шагов

## 🗂 Структура проекта

```
frontend/
├── public/              # Статические файлы
├── src/
│   ├── api/            # API клиенты
│   │   ├── axios.ts
│   │   ├── auth.api.ts
│   │   ├── courses.api.ts
│   │   ├── sections.api.ts
│   │   ├── lessons.api.ts
│   │   ├── steps.api.ts
│   │   └── agent.api.ts
│   │
│   ├── components/
│   │   ├── Layout/     # Sidebar, MainLayout
│   │   └── ui/         # Button, Input, Modal, Card...
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Courses.tsx
│   │   ├── CourseEditor.tsx
│   │   ├── AIGenerator.tsx
│   │   └── Settings.tsx
│   │
│   ├── store/          # Zustand stores
│   │   ├── authStore.ts
│   │   └── courseStore.ts
│   │
│   ├── types/          # TypeScript типы
│   ├── App.tsx         # Роутинг
│   ├── main.tsx        # Entry point
│   └── index.css       # Глобальные стили
│
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎨 Дизайн

- Темная тема с green accent цветами
- Glassmorphism эффекты
- Плавные анимации
- Адаптивный интерфейс

## 📝 Примечания

1. Перед использованием AI генератора убедитесь, что бэкенд настроен с API ключами для YandexGPT или DeepSeek.

2. Для синхронизации со Stepik:
   - Перейдите в Настройки
   - Введите Client ID и Client Secret от Stepik OAuth2 приложения
   - Создать приложение можно на: https://stepik.org/oauth2/applications/

3. Redis должен быть запущен для кэширования токенов (если используется AOP для Stepik).

