# Web Call (Self-hosted) — MVP

Видеозвонок по одной ссылке (без логинов), согласно PRD. Этот репозиторий содержит минимальный работающий прототип (MVP):
- Бэкенд: FastAPI (Python) — сигнальный сервер (REST + WebSocket), in‑memory комнаты с TTL, лимит 2 участника;
- Фронтенд: React + TypeScript + Vite — главная и страница комнаты, WebRTC (P2P) + WebSocket сигнализация;
- Docker/Compose для локального запуска. STUN/TURN предполагается внешним (например, ваш coturn).


## 1) План действий (из PRD → к реализации)
1. Бэкенд (FastAPI):
   - POST /api/rooms — создать комнату и вернуть ссылку `/r/<token>` (TTL ~7 дней).
   - GET /api/rooms/{token} — получить статус комнаты.
   - WS /ws/rooms/{token} — сигнализация: `join`, `offer`, `answer`, `candidate`, `bye`.
   - In‑memory store c TTL‑очисткой и лимитом 2 участника.
2. Фронтенд (React + TS, Vite):
   - `GET /` — кнопка «Создать ссылку», показ URL и QR.
   - `GET /r/:token` — две видеоплитки (локальная/удалённая), управление микрофоном/камерой, «Положить трубку», статусы подключения.
   - WebRTC (RTCPeerConnection) + обмен SDP/ICE через WS.
3. Docker/Compose:
   - Отдельные контейнеры frontend и backend; порты 5173 (web) и 8000 (api/ws).
   - Переменные окружения для ICE‑серверов (STUN/TURN) и базовых URL.
4. Проверка/инструкции:
   - Проверка соединения двумя клиентами по одной ссылке.
   - Инструкция запуска (Docker и локально), примеры ICE config.

Статус: пункты 1–3 реализованы; добавлены базовые инструкции и чек‑лист проверки (п.4).


## 2) Архитектура (MVP)
- Frontend (Vite/React/TS): UI, getUserMedia, RTCPeerConnection, WS сигнализация.
- Backend (FastAPI): комнаты, маршрутизация SDP/ICE, in‑memory состояние.
- STUN/TURN: ваш coturn (вне этого репо). Для локальных тестов можно оставить пустую конфигурацию ICE.

Поток подключения: клиент A и B открывают одну ссылку → WS соединение → обмен SDP/ICE → P2P‑медиа (при необходимости через TURN).


## 3) Что реализовано в этом репозитории
- backend/app/main.py — FastAPI app (REST + WS сигнализация).
- backend/app/models.py — Pydantic‑модели сообщений/DTO.
- backend/app/rooms.py — in‑memory хранилище комнат с TTL‑очисткой.
- backend/Dockerfile, backend/requirements.txt.
- frontend/ (Vite React TS): страницы Home и Room, WebRTC‑логика; Dockerfile.
- docker-compose.yml — запуск сразу двух сервисов.

Ограничения MVP: P2P только на 2 участника; нет записи, нет выбора устройства; TURN должен быть ваш.


## 4) Быстрый старт (Docker Compose)
Требования: Docker и Docker Compose.

Команды:
```bash
docker compose up --build
```
Откройте: http://localhost:5173
- Если хотите открыть с другого устройства в той же сети (LAN), используйте IP вашей хост‑машины: http://<HOST_LAN_IP>:5173 (например, http://192.168.1.50:5173). Также задайте PUBLIC_BASE_URL=http://<HOST_LAN_IP>:5173, чтобы ссылки/QR были корректными для второго устройства.

Проверка:
1) Нажмите «Создать ссылку» на главной — появится URL вида `http://localhost:5173/r/<token>` и QR.
2) Откройте ссылку в двух разных браузерах/устройствах.
3) Разрешите доступ к камере и микрофону (браузер спросит).
4) Должно установиться P2P‑соединение, появятся два видео. Кнопки: Микрофон/Камера/Положить трубку.

Примечания:
- По умолчанию клиент использует публичные STUN-сервера (Google), поэтому соединение через NAT чаще всего устанавливается без доп. настройки. Для прод-среды для максимальной надёжности укажите свои TURN-серверы. В docker-compose можно переопределить ICE через VITE_ICE_JSON.
- getUserMedia работает на https или на http://localhost — в локальном запуске это допустимо.


## 5) Локальный запуск без Docker (dev)
В одном терминале — бэкенд:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
```
В другом — фронтенд:
```bash
cd frontend
npm install
# по умолчанию фронт смотрит на http://localhost:8000 (см. src/config.ts)
npm run dev
```
Откройте http://localhost:5173, далее как в проверке.

Переменные окружения фронтенда (опционально через Vite):
- `VITE_API_BASE` — базовый URL API (например, `https://example.video`).
- `VITE_WS_BASE` — базовый WS/WSS (например, `wss://example.video`).
- `VITE_ICE_JSON` — JSON массив ICE серверов (см. пример ниже).
- `VITE_ICE_TRANSPORT_POLICY` — политика транспорта ICE: `all` (по умолчанию) или `relay` (только через TURN). Полезно в жёстко ограниченных сетях.


## 6) Настройка ICE (STUN/TURN)
Для прод‑среды укажите ваши ICE сервера (например, coturn). Пример значения для `VITE_ICE_JSON`:
```json
[
  { "urls": ["stun:turn.example.video:3478"], "username": "user", "credential": "secret" },
  { "urls": ["turn:turn.example.video:3478?transport=udp", "turns:turn.example.video:5349?transport=tcp"], "username": "user", "credential": "secret" }
]
```
В `docker-compose.yml` это поле прокидывается как build‑arg в образ фронтенда.

Также можно задать `PUBLIC_BASE_URL` для бэкенда (используется при генерации абсолютной ссылки `/api/rooms`).


## 7) Чек‑лист проверки (MVP)
- Создание ссылки на главной → получаем URL.
- Два клиента открывают ссылку → видео/аудио соединение ≤ 5 сек.
- Кнопки «Микрофон»/«Камера» работают (включение/выключение треков).
- «Положить трубку» закрывает соединение и возвращает на главную.
- Перезагрузка страницы одним участником — переподключение.
- При отключении одного клиента второй видит статус «собеседник вышел».

Сетевые тесты:
- Без UDP (firewall) — при наличии TURN‑TLS должен работать через TCP/TLS (нужно настроить ваш coturn + `VITE_ICE_JSON`).


## 8) Известные ограничения и заметки
- iOS Safari может требовать пользовательский жест для включения звука.
- При более чем 2 участниках качество деградирует (mesh не реализован в MVP).
- Нет записи звонков и выбора устройств в MVP.


## 9) Структура проекта
```
backend/
  app/
    main.py        # FastAPI: REST + WebSocket сигнализация
    models.py      # Pydantic-модели сообщений/DTO
    rooms.py       # In-memory store комнат с TTL
  requirements.txt
  Dockerfile
frontend/
  src/
    pages/
      Home.tsx     # Главная: создание ссылки, QR
      Room.tsx     # Комната: WebRTC + WS
    App.tsx
    config.ts
    main.tsx
  index.html
  tsconfig.json
  vite.config.ts
  package.json
  Dockerfile

docker-compose.yml
README.md
```

---

Вопросы/идеи по улучшению (локализация EN, выбор устройств, экранный шаринг, 3–4 участника) — см. PRD.


## 10) Доступ с другого устройства (LAN)
- Не используйте адрес вида http://172.18.x.x:5173 — это внутренний адрес Docker-сети, он не доступен из вашей локальной сети (LAN).
- Открывайте фронтенд по адресу хоста: http://<IP_хоста>:5173 (например, http://192.168.1.50:5173). Из обоих устройств используйте именно этот адрес.
- Порты уже прокинуты в docker-compose.yml: 5173 (frontend) и 8000 (backend). Убедитесь, что файрвол на хосте разрешает входящие соединения на эти порты.
- Как узнать IP хоста:
  - macOS/Linux: `ip addr` или `ifconfig` (ищите адрес вашей Wi‑Fi/Ethernet сети, обычно 192.168.x.x/10.0.x.x).
  - Windows: `ipconfig`.
- Абсолютные ссылки на комнату: чтобы сгенерированные бэкендом ссылки были «правильными» для второго устройства, задайте переменную окружения `PUBLIC_BASE_URL`:
  - Создайте рядом с docker-compose.yml файл `.env` со строкой: `PUBLIC_BASE_URL=http://<IP_хоста>:5173`
  - Перезапустите: `docker compose up --build`
- Почему в логах виден 172.18.0.x:5173: это адрес контейнера в сети Docker. Он годится только для взаимодействия контейнеров между собой, но не для устройств в вашей LAN. Используйте IP хоста (компьютера, где запущен Docker).
- Важно (камера/микрофон): браузеры требуют «защищённое происхождение» для getUserMedia. Это работает на HTTPS или на http://localhost. При открытии по IP (http://192.168.x.x) некоторые браузеры могут блокировать камеру/микрофон. Варианты:
  - Настроить локальный HTTPS (nginx/traefik с самоподписанным сертификатом).
  - Временно запустить Chrome с флагом: `--unsafely-treat-insecure-origin-as-secure="http://<IP_хоста>:5173"` (только для тестов).
  - Использовать туннель (ngrok/cloudflared) для получения https‑URL.



## 11) Azure: что такое ACR и как его создать
ACR (Azure Container Registry) — это приватный реестр Docker-образов в Azure. Наш pipeline (azure-pipelines.yml) собирает два образа (backend и frontend) и публикует их в ACR, после чего много‑контейнерный Azure Web App скачивает эти образы и запускает их.

Когда нужен ACR:
- Если вы деплоите в Azure Web App for Containers и хотите хранить образы приватно в Azure.
- Pipeline в этом репозитории рассчитывает, что у вас есть ACR (переменная acrName) и Web App.

Быстрый старт (Azure CLI, 1 команда):
1) Установите и войдите в Azure CLI: `az login`, выберите подписку: `az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"`.
2) Запустите скрипт из репозитория (создаст Resource Group, ACR, App Service Plan и Web App):
   ```bash
   ./scripts/azure_create_acr_and_webapp.sh \
     --location westeurope \
     --resource-group my-rg-webcall \
     --acr-name mywebcallacr \
     --plan-name my-webcall-plan \
     --plan-sku S1 \
     --webapp-name my-webcall-app
   ```
   Скрипт:
   - создаст ACR (Basic);
   - создаст Linux App Service Plan и Web App;
   - включит system-assigned Managed Identity у Web App и выдаст ей роль AcrPull на ACR;
   - выведет значения для переменных pipeline.

Как настроить Azure DevOps pipeline:
- В Azure DevOps → Project Settings → Service connections создайте ARM Service connection к вашей подписке/Resource Group. Запомните имя (например, `My-Azure-Conn`).
- В Variables пайплайна укажите:
  - `AZURE_SERVICE_CONNECTION` = имя ARM Service Connection (AzureRM) (например, `My-Azure-Conn`)
  - `resourceGroup` = ваш RG (например, `my-rg-webcall`)
  - `acrName` = имя ACR (например, `mywebcallacr`)
  - `webAppName` = имя Web App (например, `my-webcall-app`)
- Запустите пайплайн. Он соберёт образы с помощью ACR Tasks (`az acr build`) и задеплоит docker-compose в ваш Web App.

Альтернативно: явные команды Azure CLI (без скрипта)
```bash
# 1) RG
az group create -n my-rg-webcall -l westeurope
# 2) ACR (Basic)
az acr create -n mywebcallacr -g my-rg-webcall --sku Basic
# 3) Plan (Linux)
az appservice plan create -g my-rg-webcall -n my-webcall-plan --is-linux --sku S1
# 4) Web App (Linux)
az webapp create -g my-rg-webcall -p my-webcall-plan -n my-webcall-app --runtime "PYTHON:3.11"
# 5) Managed Identity
az webapp identity assign -g my-rg-webcall -n my-webcall-app
PRINCIPAL_ID=$(az webapp identity show -g my-rg-webcall -n my-webcall-app --query principalId -o tsv)
ACR_ID=$(az acr show -n mywebcallacr --query id -o tsv)
az role assignment create --assignee "$PRINCIPAL_ID" --scope "$ACR_ID" --role "AcrPull"
# 6) App settings (URL реестра)
ACR_LOGIN_SERVER=$(az acr show -n mywebcallacr --query loginServer -o tsv)
az webapp config appsettings set -g my-rg-webcall -n my-webcall-app --settings \
  WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
  DOCKER_REGISTRY_SERVER_URL="https://$ACR_LOGIN_SERVER"
```

Полезные заметки:
- Имена ACR и Web App должны быть глобально уникальны.
- В нашем azure-pipelines.yml переменная `acrLoginServer` формируется как `$(acrName).azurecr.io` — это верно для Public Azure. В суверенных облаках используйте фактическое значение `loginServer` из `az acr show`.
- Можно включить ACR Admin user и использовать логин/пароль, но рекомендуемый способ — Managed Identity + роль `AcrPull` (как в скрипте).
- Для PUBLIC_BASE_URL (абсолютные ссылки) задайте переменную окружения в Web App или в compose, если нужно.


## 12) FAQ / Troubleshooting: «ICE: failed» — что это и почему происходит?
Что означает это сообщение?
- В интерфейсе комнаты (frontend/src/pages/Room.tsx) статус соединения берётся из `pc.iceConnectionState`. Когда вы видите «ICE: failed», это значит, что ICE‑агент WebRTC не смог найти ни одной рабочей пары кандидатов (пути связи) между пирами. Соединение не установлено или разорвано.

Почему это происходит чаще всего:
- Отсутствует TURN‑сервер. STUN даёт только публичный адрес (srflx) и часто достаточен в простых NAT, но при симметричном NAT или строгих фаерволах нужен TURN (ретрансляция через внешний сервер).
- Заблокирован UDP (порт 3478/медиапорты) корпоративной сетью/фаерволом. Если разрешён только TCP/443, нужен TURN по TCP/TLS (urls вида `turn:...transport=tcp` и `turns:...`).
- Неверные учётные данные/realm для TURN, сертификат/TLS для `turns:` не совпадает с хостнеймом, либо DNS недоступен.
- Неправильная конфигурация ICE на клиенте (пустой/битый JSON, опечатка в `VITE_ICE_JSON`).
- TURN‑сервер за NAT без `external-ip`/портов, либо закрыт диапазон медиапортов.

Где настраивается ICE в этом репозитории:
- frontend/src/config.ts — строит `ICE_SERVERS` из переменной окружения `VITE_ICE_JSON`. Если она пуста/`[]`, используются дефолтные публичные STUN‑сервера Google (этого может быть недостаточно в проде).
- docker-compose.yml — аргумент сборки `VITE_ICE_JSON` для фронтенда. Укажите здесь ваш STUN/TURN.

Пример рабочей конфигурации `VITE_ICE_JSON` (STUN + TURN с UDP/TCP/TLS):
```json
[
  { "urls": ["stun:turn.example.com:3478"] },
  { "urls": [
      "turn:turn.example.com:3478?transport=udp",
      "turn:turn.example.com:3478?transport=tcp",
      "turns:turn.example.com:5349?transport=tcp"
    ],
    "username": "user",
    "credential": "secret"
  }
]
```
Подставьте ваш домен/хост, логин/пароль. Для сетей, где разрешён только 443/TLS, можно прокинуть `turns` через 443 (см. заметку ниже про coturn).

Быстрый чек‑лист диагностики:
- Откройте chrome://webrtc-internals (Chrome) и DevTools → Console. Посмотрите события `iceConnectionState` и кандидаты. Если все candidate‑пары завершаются `failed`, почти наверняка нужен TURN.
- Протестируйте ваши ICE‑серверы на странице Trickle ICE: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- Проверьте доступность TURN:
  - UDP/TCP 3478 и TLS 5349 (либо 443 для TLS) со стороны клиента (фаервол/прокси).
  - DNS и сертификат (для `turns:` CN/SAN должны совпадать с хостом).
- Убедитесь, что `VITE_ICE_JSON` действительно применён: в прод‑сборке откройте DevTools → Network → посмотрите значение, зашитое в бандл (или логируйте `ICE_SERVERS`).
- Для getUserMedia браузерам нужен https или http://localhost. Отсутствие https не вызывает «ICE: failed», но помешает включить камеру/микрофон и вы не дойдёте до ICE.

Мини‑гайд по coturn (пример):
- Базовые опции в turnserver.conf:
  - `listening-port=3478`
  - `tls-listening-port=5349` (или 443, если требуется обход корпоративных ограничений)
  - `fingerprint`
  - `lt-cred-mech`
  - `realm=example.com`
  - `user=user:secret` (или `userdb` для продакшена)
  - `cert=/path/fullchain.pem` и `pkey=/path/privkey.pem` для TLS
  - Если сервер за NAT: `external-ip=<PUBLIC_IP>`
  - Ограничьте медиапорты: `min-port=49152`, `max-port=49999` и откройте их в фаерволе

Типовые решения, если видите «ICE: failed»:
- Добавьте/включите TURN и укажите его в `VITE_ICE_JSON` (UDP + TCP + TLS).
- Разрешите исходящий UDP и/или обеспечьте `turns:` на 443/TLS как fallback.
- Проверьте корректность логина/пароля/realm для TURN и актуальность сертификата.
- Проверьте, что оба клиента используют один и тот же публичный адрес сайта/домен (особенно при работе за прокси/туннелями).

Дополнительно: клиент автоматически пытается выполнить ICE‑restart при сбоях ("ICE: failed" или длительное "disconnected"). Если вы находитесь в жёстко ограниченной сети, можно принудительно включить режим только через TURN, задав `VITE_ICE_TRANSPORT_POLICY=relay` (по умолчанию `all`). Это снижает вероятность "ICE: failed", но требует корректно настроенного TURN.

Если всё равно не работает — соберите логи из chrome://webrtc-internals и приложите конфигурацию `VITE_ICE_JSON`; по логам можно увидеть, какие кандидаты формируются и на чём срывается проверка связности.


v-001