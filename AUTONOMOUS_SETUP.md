# Полностью автономная конфигурация Web Call

## Обзор

Этот документ описывает настройку полностью автономной версии Web Call без зависимости от внешних серверов (Google STUN серверов).

## Преимущества автономной конфигурации

### 🔒 Приватность и безопасность
- **Никакие данные не покидают вашу инфраструктуру**
- **Полный контроль над трафиком**
- **Соответствие строгим корпоративным политикам**

### 🚀 Надежность и производительность
- **Нет зависимости от внешних сервисов**
- **Предсказуемая производительность**
- **Возможность оптимизации под ваши нужды**

### 🏢 Корпоративная совместимость
- **Работает в изолированных сетях**
- **Соответствует требованиям безопасности**
- **Подходит для правительственных и финансовых организаций**

## Архитектура

```
┌─────────────────┐    ┌─────────────────┐
│   Клиент A      │    │   Клиент B      │
│                 │    │                 │
│  WebRTC Client  │    │  WebRTC Client  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │  P2P Connection      │
          │  (если возможно)     │
          │                      │
          └──────────┬───────────┘
                     │
          ┌──────────▼───────────┐
          │                      │
          │   TURN Server        │
          │   (localhost:3478)   │
          │                      │
          │  • STUN Service      │
          │  • TURN Relay        │
          │  • Authentication    │
          └──────────────────────┘
```

## Конфигурация

### 1. Базовая автономная конфигурация

В файле `.env`:
```bash
# TURN Server configuration
TURN_USERNAME=user
TURN_PASSWORD=secret
TURN_REALM=localhost

# ICE configuration - только наш TURN сервер
VITE_ICE_JSON=[{"urls":["stun:localhost:3478"]},{"urls":["turn:localhost:3478?transport=udp"],"username":"user","credential":"secret"}]
VITE_ICE_TRANSPORT_POLICY=all
```

### 2. Максимальная автономность (только TURN)

Для максимальной автономности можно использовать только TURN сервер:

```bash
# Только TURN, без STUN
VITE_ICE_JSON=[{"urls":["turn:localhost:3478?transport=udp"],"username":"user","credential":"secret"}]
VITE_ICE_TRANSPORT_POLICY=relay
```

### 3. Продакшен конфигурация

Для внешнего доступа:
```bash
# TURN Server configuration
TURN_USERNAME=your_username
TURN_PASSWORD=your_secure_password
TURN_REALM=your-domain.com
TURN_EXTERNAL_IP=YOUR_PUBLIC_IP

# ICE configuration для продакшена
VITE_ICE_JSON=[{"urls":["stun:your-domain.com:3478"]},{"urls":["turn:your-domain.com:3478?transport=udp","turn:your-domain.com:3478?transport=tcp","turns:your-domain.com:5349?transport=tcp"],"username":"your_username","credential":"your_secure_password"}]
```

## Запуск

### 1. Клонирование и настройка
```bash
git clone <repository>
cd web-call
cp env.example .env
# Отредактируйте .env файл
```

### 2. Запуск приложения
```bash
docker compose up --build -d
```

### 3. Проверка
```bash
# Проверка TURN сервера
./scripts/test_turn.sh

# Проверка логов
docker logs webcall-turn

# Откройте http://localhost:5173
```

## Мониторинг и диагностика

### Проверка автономности

1. **Откройте DevTools в браузере**
2. **Перейдите на chrome://webrtc-internals/**
3. **Проверьте ICE кандидаты** - должны быть только ваши серверы
4. **Убедитесь, что нет обращений к Google STUN**

### Логи TURN сервера
```bash
# Мониторинг в реальном времени
docker logs -f webcall-turn

# Поиск STUN запросов
docker logs webcall-turn | grep -i stun

# Поиск TURN запросов
docker logs webcall-turn | grep -i turn
```

### Сетевой мониторинг
```bash
# Проверка исходящих соединений
netstat -an | grep 3478

# Проверка, что нет соединений к Google
netstat -an | grep stun.l.google.com
```

## Безопасность

### Рекомендации по безопасности

1. **Сильные пароли**
   ```bash
   TURN_PASSWORD=$(openssl rand -base64 32)
   ```

2. **Ограничение доступа по IP**
   ```conf
   # В turnserver.conf
   allowed-peer-ip=192.168.1.0/24
   denied-peer-ip=0.0.0.0/0
   ```

3. **TLS шифрование**
   ```bash
   # Получение сертификата
   sudo certbot certonly --standalone -d your-domain.com
   
   # Настройка в docker-compose.yml
   volumes:
     - ./certs:/etc/coturn/certs:ro
   ```

4. **Мониторинг и алерты**
   ```bash
   # Проверка состояния TURN сервера
   curl -s http://localhost:9641/metrics | grep turn
   ```

## Масштабирование

### Несколько TURN серверов

Для высоких нагрузок можно развернуть несколько TURN серверов:

```yaml
# docker-compose.yml
services:
  turn1:
    image: coturn/coturn:4.6.2
    ports:
      - "3478:3478"
    # ... конфигурация

  turn2:
    image: coturn/coturn:4.6.2
    ports:
      - "3479:3478"
    # ... конфигурация

  turn3:
    image: coturn/coturn:4.6.2
    ports:
      - "3480:3478"
    # ... конфигурация
```

```bash
# ICE конфигурация с несколькими серверами
VITE_ICE_JSON=[
  {"urls":["stun:localhost:3478"]},
  {"urls":["stun:localhost:3479"]},
  {"urls":["stun:localhost:3480"]},
  {"urls":["turn:localhost:3478?transport=udp"],"username":"user","credential":"secret"},
  {"urls":["turn:localhost:3479?transport=udp"],"username":"user","credential":"secret"},
  {"urls":["turn:localhost:3480?transport=udp"],"username":"user","credential":"secret"}
]
```

### Географическое распределение

Для глобального использования разверните TURN серверы в разных регионах:

```bash
# Европа
VITE_ICE_JSON=[{"urls":["stun:eu.your-domain.com:3478"]},{"urls":["turn:eu.your-domain.com:3478?transport=udp"],"username":"user","credential":"secret"}]

# США
VITE_ICE_JSON=[{"urls":["stun:us.your-domain.com:3478"]},{"urls":["turn:us.your-domain.com:3478?transport=udp"],"username":"user","credential":"secret"}]

# Азия
VITE_ICE_JSON=[{"urls":["stun:asia.your-domain.com:3478"]},{"urls":["turn:asia.your-domain.com:3478?transport=udp"],"username":"user","credential":"secret"}]
```

## Troubleshooting

### Проблема: "ICE: failed" в автономном режиме

**Возможные причины:**
- TURN сервер недоступен
- Неправильные учетные данные
- Блокировка портов

**Решение:**
```bash
# Проверка TURN сервера
docker logs webcall-turn

# Проверка портов
netstat -an | grep 3478

# Тест подключения
nc -u -w 5 localhost 3478
```

### Проблема: Медленное подключение

**Возможные причины:**
- Слишком много ICE серверов
- Неоптимальная конфигурация

**Решение:**
```bash
# Ограничьте количество серверов
VITE_ICE_JSON=[{"urls":["turn:localhost:3478?transport=udp"],"username":"user","credential":"secret"}]
VITE_ICE_TRANSPORT_POLICY=relay
```

### Проблема: Высокая нагрузка на TURN сервер

**Возможные причины:**
- Слишком много клиентов
- Неэффективная конфигурация

**Решение:**
```bash
# Увеличьте количество потоков
--relay-threads=8

# Ограничьте количество соединений
--user-quota=100
--total-quota=1000
```

## Заключение

Автономная конфигурация Web Call обеспечивает:

1. **Полную независимость** от внешних сервисов
2. **Максимальную приватность** данных
3. **Полный контроль** над инфраструктурой
4. **Соответствие строгим требованиям** безопасности
5. **Масштабируемость** для высоких нагрузок

Эта конфигурация идеально подходит для:
- Корпоративных сред с ограничениями
- Правительственных организаций
- Финансовых учреждений
- Любых сред, где важна приватность и контроль

Приложение теперь работает полностью автономно, без каких-либо обращений к внешним серверам.
