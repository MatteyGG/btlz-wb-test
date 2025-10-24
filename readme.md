#  Тестовое задание от lucard17

Сервис **«настроил и забыл»** для сбора данных из API Wildberries и сохранения их в PostgreSQL.  
Сервис автоматически обновляет данные и экспортирует их в Google Sheets API, а при ошибках отправляет уведомления в Telegram.
<details>
  <summary>Более подробно</summary>
Исходя из ТЗ, я решил, что напишу сервис «настроил и забыл».
Это сборщик с API Wildberries, который собирает достаточно сырые, но полные данные в PostgreSQL (можно дописать любой хранилище).
Сервис старается быть самодостаточным. Fetch написан с ретраями только для 429. Google Sheets выступает скорее системой мониторинга.
Но для меня важно, чтобы сервис мог позвать на помощь — поэтому есть модуль telegram_notify, который вызывается при попадании в ошибки.
Мне кажется, что при такой узкой задаче базовых логов вполне достаточно.

В дальнейшем я бы делал упор на обработку всевозможных ошибок и отказоустойчивость: в размерах сервиса вполне возможно проработать все варианты, как он может «упасть». Этот сервис может стать фундаментом для процесса сбора и анализа данных, базовым кирпичиком.
</details>

**Основные особенности:**
- Автоматический сбор и обновление данных.
- Ретрай только при HTTP 429.
- Интеграция с Google Sheets для мониторинга.
- Telegram-уведомления об ошибках.
- Поддержка расширения под другие хранилища.

## 🚀 Быстрый старт

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/MatteyGG/btlz-wb-test
   cd btlz-wb-test
   ```

2. Скопируйте и настройте переменные окружения:
   ```bash
   cp example.env .env
   ```

3. Заполните `.env`:
   ```env
   WB_API_TOKEN=ваш_токен_WB

   GOOGLE_CLIENT_EMAIL=xxxx@iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GSHEETS_IDS=sheet_id_1,sheet_id_2

   TELEGRAM_BOT_TOKEN= # Можно оставить пустым, если не используете
   TELEGRAM_CHAT_ID= # Можно оставить пустым, если не используете
   ```

   
- [Настройка переменных для  Google Sheets API](README-google-sheets.md)  
- [Настройка переменных для Telegram-бота](README-telegram.md)

4. Запустите с помощью Docker:
   ```bash
   docker compose up --build -d
   ```

5. Проверьте логи:
   ```bash
   docker compose logs
   ```

---


## 📦 Используемые пакеты

- **knex** — работа с PostgreSQL  
- **googleapis** — взаимодействие с Google Sheets  
- **node-cron** — планирование задач  
- **zod** — валидация переменных окружения  

## ⚙️ Логика работы

- В `app.ts` запускаются cron-задачи:
  - `get_and_update_database` — получает данные из Wildberries API и сохраняет их в базу.
  - `get_and_update_gsheet` — читает данные из базы и обновляет Google Sheets.
- Ключевые сервисы:
  - `wb-api.service.ts` — работа с API Wildberries.
  - `warehouse.database.service.ts` — взаимодействие с PostgreSQL.
  - `gsheets-api.service.ts` — обновление Google Sheets.
  - `telegram_notify` — уведомления об ошибках через Telegram.
- Оркестрация задач реализована в `tariffs.module.ts`.

---

## 🧪 Разработка и тестирование

Для запуска локально без Docker:
```bash
npm install
npm run dev
```

## 🪪 Лицензия

MIT License — свободно используйте, модифицируйте и распространяйте.
