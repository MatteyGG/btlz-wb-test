#  Тестовое задание от lucard17

Сервис **«настроил и забыл»** для сбора данных из API Wildberries и сохранения их в PostgreSQL.  
Сервис автоматически обновляет данные и экспортирует их в Google Sheets API, а при ошибках отправляет уведомления в Telegram.
<details>
  <summary>Более подробно</summary>
Исходя из ТЗ я решил, что напишу сервис "настроил и забыл". 
Это сборщик с API wildberries, что собирает достаточно сырые, но полные данные в PostgreSQL(Можно дописать любой storage). 
Сервис старается быть самодостаточным. Fetch написан с ретраями только для 429.  Google sheets выступает скорее системой мониторинга. 
Но для меня важно, чтоб сервис мог позвать на помощь поэтому есть модуль telegram_notify, который вызывается при попадания в ошибки. 
</details>

**Основные особенности:**
- Автоматический сбор и обновление данных.
- Ретрай только при HTTP 429.
- Интеграция с Google Sheets для мониторинга.
- Telegram-уведомления об ошибках.
- Поддержка расширения под другие хранилища.

Quick start
Скопируйте проект с github

example.env содержит набор необходимых перменных окружения для работы проекта. 
cp example.env .env
Внесите WB_API_TOKEN 


GOOGLE_CLIENT_EMAIL= .iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n\n-----END PRIVATE KEY-----\n"
#ID Google таблиц разделять запятой 
GSHEETS_IDS=
Ссылка на раздел с получением GOOGLE_CLIENT_EMAIL и GOOGLE_PRIVATE_KEY и GSHEETS_IDS

# Telegram
TELEGRAM_BOT_TOKEN= #Можно оставить пустым
TELEGRAM_CHAT_ID=-1002516011692 #Начинается с -100

Запустите compose.yaml командой 
docker compose up --build -d

Можете просмотреть логи 
docker compose logs

Пакеты, используемые в проекте:
knex - Для работы с postgreSql
googleapis - Для работы с Google sheets
node-cron - Для обновления данных по расписанию 
zod - Для валидации перменных

Логика сервиса:
- В app.ts мы настраиваем schedule для двух задач:
 - Обновить и сохранить данные в storage(PostgreSql) wb-api.service.ts и warehouse.database.service.ts
 - Прочитать данные из storage и обновить Google sheets  warehouse.database.service.ts и gsheets-api.service.ts
Оркестратором выступает tariffs.module.ts, в нем описаны процессы get_and_update_database и get_and_update_gsheet, которые мы триггерим в cron




MIT License — свободно используйте, модифицируйте и распространяйте.
