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

Проверка:
1) Нажмите «Создать ссылку» на главной — появится URL вида `http://localhost:5173/r/<token>` и QR.
2) Откройте ссылку в двух разных браузерах/устройствах.
3) Разрешите доступ к камере и микрофону (браузер спросит).
4) Должно установиться P2P‑соединение, появятся два видео. Кнопки: Микрофон/Камера/Положить трубку.

Примечания:
- Для реальных сетей за NAT потребуется TURN. В Compose по умолчанию ICE пустой `[]` — подходит для локальной/одно‑LAN проверки.
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
