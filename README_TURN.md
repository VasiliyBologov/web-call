# Настройка TURN сервера для Web Call

Этот документ описывает настройку TURN сервера для обхода NAT/Firewall в приложении Web Call.

## Что такое TURN сервер?

TURN (Traversal Using Relays around NAT) сервер - это компонент WebRTC, который позволяет устанавливать медиасоединения между клиентами, находящимися за строгими NAT или firewall, путем ретрансляции трафика через промежуточный сервер.

## Зачем нужен TURN сервер?

- **Симметричный NAT**: Когда клиенты находятся за симметричным NAT, прямое P2P соединение невозможно
- **Корпоративные сети**: Firewall блокирует UDP трафик или медиапорты
- **Мобильные сети**: Операторы мобильной связи блокируют P2P соединения
- **Надежность**: Обеспечивает fallback для случаев, когда STUN не работает
- **Автономность**: Позволяет полностью отказаться от внешних серверов (Google STUN)

## Архитектура с TURN сервером

```
Клиент A ←→ TURN Сервер ←→ Клиент B
    ↑           ↑           ↑
  NAT A     Интернет     NAT B
```

## Полная автономность (без внешних серверов)

### Преимущества отказа от Google STUN серверов:

1. **Приватность**: Никакие данные не отправляются на серверы Google
2. **Надежность**: Нет зависимости от внешних сервисов
3. **Контроль**: Полный контроль над инфраструктурой
4. **Соответствие требованиям**: Подходит для корпоративных сред с ограничениями

### Конфигурация для полной автономности:

```bash
# Вариант 1: STUN + TURN (рекомендуется)
VITE_ICE_JSON=[{"urls":["stun:localhost:3478"]},{"urls":["turn:localhost:3478?transport=udp"],"username":"user","credential":"secret"}]

# Вариант 2: Только TURN (максимальная автономность)
VITE_ICE_JSON=[{"urls":["turn:localhost:3478?transport=udp"],"username":"user","credential":"secret"}]
VITE_ICE_TRANSPORT_POLICY=relay
```

## Быстрый старт с Docker

### 1. Создайте файл .env

```bash
cp env.example .env
```

### 2. Настройте TURN сервер в .env

```bash
# TURN Server configuration
TURN_USERNAME=user
TURN_PASSWORD=secret
TURN_REALM=localhost
TURN_EXTERNAL_IP=

# Frontend ICE configuration (автономная)
VITE_ICE_JSON=[{"urls":["stun:localhost:3478"]},{"urls":["turn:localhost:3478?transport=udp"],"username":"user","credential":"secret"}]
VITE_ICE_TRANSPORT_POLICY=all
```

### 3. Запустите приложение

```bash
docker compose up --build
```

### 4. Протестируйте TURN сервер

```bash
./scripts/test_turn.sh
```

## Конфигурация для продакшена

### Для внешнего доступа

Если вы хотите, чтобы TURN сервер был доступен из интернета:

1. **Настройте внешний IP**:
```bash
TURN_EXTERNAL_IP=YOUR_PUBLIC_IP
```

2. **Откройте порты в firewall**:
```bash
# UDP порты для медиа
sudo ufw allow 3478/udp
sudo ufw allow 49152:49999/udp

# TCP порты для TURN
sudo ufw allow 3478/tcp
sudo ufw allow 5349/tcp
```

3. **Обновите ICE конфигурацию**:
```bash
VITE_ICE_JSON=[{"urls":["stun:YOUR_DOMAIN:3478"]},{"urls":["turn:YOUR_DOMAIN:3478?transport=udp","turn:YOUR_DOMAIN:3478?transport=tcp","turns:YOUR_DOMAIN:5349?transport=tcp"],"username":"user","credential":"secret"}]
```

### TLS конфигурация (рекомендуется)

Для безопасного соединения настройте TLS:

1. **Получите SSL сертификат** (Let's Encrypt):
```bash
sudo certbot certonly --standalone -d your-domain.com
```

2. **Создайте директорию для сертификатов**:
```bash
mkdir -p certs
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/
chmod 600 certs/*
```

3. **Обновите turnserver.conf**:
```conf
# TLS configuration
cert=/etc/coturn/certs/fullchain.pem
pkey=/etc/coturn/certs/privkey.pem
```

4. **Обновите docker-compose.yml**:
```yaml
turn:
  volumes:
    - ./turnserver.conf:/etc/coturn/turnserver.conf:ro
    - ./certs:/etc/coturn/certs:ro
  command: >
    --config /etc/coturn/turnserver.conf
    --user=${TURN_USERNAME:-user}:${TURN_PASSWORD:-secret}
    --realm=${TURN_REALM:-localhost}
    --external-ip=${TURN_EXTERNAL_IP:-}
    --listening-port=3478
    --tls-listening-port=5349
    --min-port=49152
    --max-port=49999
    --fingerprint
    --lt-cred-mech
    --cert=/etc/coturn/certs/fullchain.pem
    --pkey=/etc/coturn/certs/privkey.pem
    --log-file=stdout
    --verbose
```

## Мониторинг и диагностика

### Логи TURN сервера

```bash
# Просмотр логов
docker logs webcall-turn

# Мониторинг в реальном времени
docker logs -f webcall-turn
```

### Тестирование подключения

```bash
# Базовый тест
./scripts/test_turn.sh

# Тест с внешним хостом
TURN_HOST=your-domain.com ./scripts/test_turn.sh
```

### WebRTC диагностика

1. Откройте Chrome DevTools
2. Перейдите на chrome://webrtc-internals/
3. Проверьте ICE кандидаты и их статус
4. Ищите ошибки подключения к TURN серверу

## Troubleshooting

### Проблема: "ICE: failed"

**Возможные причины:**
- TURN сервер недоступен
- Неправильные учетные данные
- Блокировка портов firewall
- Неправильная конфигурация ICE

**Решение:**
1. Проверьте доступность TURN сервера:
```bash
telnet your-domain.com 3478
```

2. Проверьте логи:
```bash
docker logs webcall-turn
```

3. Убедитесь, что ICE конфигурация корректна:
```bash
echo $VITE_ICE_JSON
```

### Проблема: Медленное подключение

**Возможные причины:**
- Слишком много ICE серверов
- Неоптимальная конфигурация
- Сетевые задержки

**Решение:**
1. Ограничьте количество ICE серверов (максимум 4-5)
2. Приоритизируйте TURN серверы над STUN
3. Используйте локальные TURN серверы

### Проблема: TLS ошибки

**Возможные причины:**
- Недействительный сертификат
- Неправильный путь к сертификатам
- Несоответствие домена

**Решение:**
1. Проверьте срок действия сертификата:
```bash
openssl x509 -in certs/fullchain.pem -text -noout
```

2. Обновите сертификат:
```bash
sudo certbot renew
```

## Оптимизация производительности

### Настройка медиапортов

```conf
# В turnserver.conf
min-port=49152
max-port=49999
```

### Мониторинг ресурсов

```bash
# Мониторинг CPU и памяти
docker stats webcall-turn

# Мониторинг сетевого трафика
docker exec webcall-turn netstat -i
```

### Масштабирование

Для высоких нагрузок рассмотрите:
- Несколько TURN серверов с балансировкой
- Географическое распределение
- Мониторинг и алерты

## Безопасность

### Рекомендации

1. **Используйте сильные пароли**
2. **Включите TLS**
3. **Ограничьте доступ по IP**
4. **Мониторьте логи**
5. **Регулярно обновляйте coturn**

### Конфигурация безопасности

```conf
# В turnserver.conf
# Ограничение по IP
allowed-peer-ip=192.168.1.0/24

# Временные учетные данные
lt-cred-mech

# Логирование
log-file=stdout
verbose
```

## Альтернативные TURN серверы

### Twilio TURN

```bash
VITE_ICE_JSON=[{"urls":["turn:global.turn.twilio.com:3478?transport=udp","turn:global.turn.twilio.com:3478?transport=tcp","turns:global.turn.twilio.com:443?transport=tcp"],"username":"YOUR_USERNAME","credential":"YOUR_PASSWORD"}]
```

### XirSys TURN

```bash
VITE_ICE_JSON=[{"urls":["turn:turn.xirsys.com:80?transport=udp","turn:turn.xirsys.com:80?transport=tcp","turns:turn.xirsys.com:443?transport=tcp"],"username":"YOUR_USERNAME","credential":"YOUR_PASSWORD"}]
```

## Заключение

Правильно настроенный TURN сервер значительно повышает надежность WebRTC соединений в сложных сетевых условиях. Следуйте рекомендациям по безопасности и мониторингу для стабильной работы в продакшене.

### Преимущества автономной конфигурации:

1. **Полная независимость** от внешних сервисов
2. **Приватность данных** - никакая информация не покидает вашу инфраструктуру
3. **Контроль качества** - вы полностью контролируете производительность
4. **Соответствие требованиям** - подходит для строгих корпоративных политик
5. **Масштабируемость** - можно развернуть несколько TURN серверов для балансировки нагрузки
