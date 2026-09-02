# EasyCourse — контекст проекта

Веб-платформа (easy-course.ru): AI-генерация учебных курсов и публикация их на Stepik.
Backend — Java 21 / Spring Boot 3.2, фронтенд — React 18 + TypeScript. Монорепозиторий Gradle + `frontend/`.

## Модули

- `app/` — основной backend (порт 8080, пакет `org.core`). REST API (JWT-аутентификация), JPA/MariaDB + Liquibase, Redis, Kafka-продюсер (Avro), интеграции с LLM (Provod, DeepSeek, YandexGPT — через `openai-java`), Stepik API (resilience4j: retry/bulkhead/circuit breaker), email, подписки (free/pro лимиты).
- `bot/` — Telegram-бот (порт 8081, пакет `org`). Консьюмер Kafka, шлёт уведомления о регистрации/подписке (`java-telegram-bot-api` от pengrad).
- `events/` — Avro-схемы событий (`src/main/avro/*.avsc`, namespace `org.core.event`). Кодогенерация таской `generateAvroJava` при `compileJava`.
- `frontend/` — SPA: Vite, Tailwind, zustand, react-query, framer-motion, axios. Прокси `/api` в dev-режиме (см. `vite.config.ts`).
- `deploy/` — nginx-конфиги, observability (Grafana + Loki + Promtail), `prod-environment.env` (env для прода).

**Связь app ↔ bot — только через Kafka** (прямых зависимостей Gradle между ними нет): топик `account-update-listener` (свойство `app.kafka.account-update-topic`), событие `AccountUpdateEvent` (Avro) со Schema Registry `http://localhost:8085`, кластер `localhost:9092,9094,9096`.

## Команды

```bash
# Backend (требуется JDK 21; путь зафиксирован в gradle.properties)
./gradlew build                 # сборка всех модулей
./gradlew :app:test             # тесты app
./gradlew :app:test --tests "XyzTest"   # один тест-класс
./gradlew :bot:build

# Frontend (из каталога frontend/)
npm run dev        # dev-сервер на 5173
npm run build      # tsc -b && vite build && prerender (scripts/prerender.mjs)
npm run lint       # eslint
npx tsc -b         # только типчек
```

Тестов в `app` мало (юниты JUnit 5 + Mockito + AssertJ); фронтенд-тестов нет.

## Архитектура `app` (слой → слой, вниз только)

`rest/` (контроллеры: `ai`, `crud`, `stepik`, `subscription`, `security`) → `service/` (те же подобласти + `registration`, `restPassword`, `email`, `telegram`, `agent`) → `repository/` → `domain/`.
Прочее: `dto/` повторяет структуру доменов, `aspect/` + `annotation/` (AOP для Stepik-токенов), `config/security`, `exception`, `event`, `util`.
Контроллеры не трогают репозитории напрямую; логика — в сервисах.

## База данных / Liquibase

- MariaDB, база `easy_course_db`; дефолтный профиль `mysql-local` (есть h2-профиль для тестов).
- Ченджлоги: `app/src/main/resources/db/changelog/templates/changelog-N.xml`, сейчас 32 штуки. **Новое изменение = новый файл `changelog-33.xml` + строка `<include>` в `changelog-master.xml`. Уже применённые ченджлоги не редактировать.**
- `spring.jpa.hibernate.ddl-auto=update` включён параллельно с Liquibase — схему вести через Liquibase.

## Конфигурация и секреты

- Секреты только через env-переменные `${...}`: `SPRING_MAIL_*`, `DEEPSEEK_API_KEY`, `PROVOD_API_KEY`, `YANDEX_GPT_API_KEY`, `STEPIK_API_TOKEN`, `JWT_SECRET`, `REDIS_*`, `RECAPTCHA_SITE_KEY`, `APP_REGISTRATION_*`. Прод-env — `deploy/prod-environment.env`. Не коммитить секреты.
- ⚠️ Токен Telegram сейчас захардкожен в `bot/src/main/resources/application.properties` (`app.telegram.token`) — не разносить этот паттерн дальше, новые секреты только через env.
- LLM-провайдеры и лимиты токенов настраиваются в `app/src/main/resources/application.properties` (`provod.api.model-name.*`, `max.tokens.*`, `subscription.*`).
- Долгие LLM-вызовы: `spring.mvc.async.request-timeout=600000`, SSE-таймаут `course.sse.connection.timeout`; фронтовый таймаут AI-запросов 600 с (`frontend/src/config/api.ts`).
- CORS в dev разрешает туннели `*.tuna.am` и `localhost:*`.

## Конвенции

- Коммиты: `BE - <описание>` / `FE - <описание>` (существующая история на английском и русском). Ветки: `BE-<номер задачи>/0`, `FE-...`, мержатся в `main` через PR.
- Java: Lombok везде, кодировка UTF-8 принудительно в build.gradle. Комментарии в коде — на русском.
- Avro-схемы в `events/` — с русскими doc-полями; после изменения схемы классы перегенерируются сами при сборке.
- Фронтенд: API-клиент в `frontend/src/api` (axios, baseURL из `frontend/src/config/api.ts`), состояние — zustand (`store/`), страницы — `pages/`.

## Особенности / гоча

- Windows + Git Bash: в шелле использовать прямые слэши (`C:/Projects/easyCourse`), обратные ломают sed/поиск.
- `gradle.properties` пинит `org.gradle.java.home=C:/Program Files/Java/jdk-21` и Gradle-кэш в `C:/GradleCache` — на другой машине поправить.
- Dev-прокси `/api` по умолчанию смотрит на `http://127.0.0.1:8081` (`VITE_DEV_API_PROXY` в `vite.config.ts`), а `app` поднимается на 8080 — при локальной разработке задавать `VITE_DEV_API_PROXY=http://127.0.0.1:8080`.
- Прод-сборка: Dockerfile'ы в `bot/` (jar `easy-course-bot-1.0.0.jar`) и `frontend/` (node build + nginx); prod-compose перенесён из `deploy/` в корень (`docker-compose-prod.yml`).
- `course-captcha-test.html`, `lesson-captcha-test.html` в корне — временные тестовые файлы, не часть продукта.
- Инфра локально: MariaDB 3306, Redis 6379, Kafka 9092/9094/9096, Schema Registry 8085.
