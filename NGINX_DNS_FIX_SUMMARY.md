# Исправление проблемы с nginx DNS resolution в Docker

## Проблема
В продакшене возникала ошибка:
```
nginx: [emerg] host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:40
```

Это происходило потому, что nginx не мог разрешить имя Docker сервиса "backend" при старте контейнера.

## Причина
1. **DNS resolution**: nginx не мог разрешить имя "backend" в IP адрес
2. **Docker network**: контейнеры не могли найти друг друга по именам сервисов
3. **Конфигурация nginx**: отсутствовал DNS resolver для Docker DNS (127.0.0.11)

## Решение

### 1. Исправление nginx.conf
Добавлен DNS resolver и улучшена конфигурация проксирования:

```nginx
# DNS resolver for Docker services
resolver 127.0.0.11 valid=30s;

# API proxy с переменной для backend
location /api/ {
    set $backend_service "http://backend:8000";
    proxy_pass $backend_service;
    # ... остальные настройки
}
```

### 2. Улучшение Docker Compose
- Добавлены более надежные health checks
- Улучшена конфигурация сети
- Добавлены restart policies

### 3. Улучшение Dockerfile
- Добавлен netcat для лучших health checks
- Создается кастомная nginx.conf
- Улучшена конфигурация nginx

### 4. Скрипты для диагностики и перезапуска
- `scripts/restart_services.sh` - безопасный перезапуск сервисов
- `scripts/diagnose_network.sh` - диагностика сетевых проблем

## Результат
✅ DNS resolution работает корректно  
✅ API проксирование функционирует  
✅ WebSocket проксирование функционирует  
✅ Сетевая связность между контейнерами восстановлена  
✅ Health checks проходят успешно  

## Команды для проверки

### Проверка здоровья сервисов
```bash
# Backend health
curl http://localhost:8000/api/health

# Frontend health через nginx
curl http://localhost:5173/api/health

# Frontend health endpoint
curl http://localhost:5173/health
```

### Диагностика сети
```bash
./scripts/diagnose_network.sh
```

### Перезапуск сервисов
```bash
./scripts/restart_services.sh
```

## Профилактика
1. **Мониторинг**: регулярно проверять логи nginx на ошибки DNS
2. **Health checks**: использовать health checks для автоматического перезапуска
3. **Сетевые тесты**: периодически тестировать связность между контейнерами
4. **Логирование**: настроить детальное логирование для быстрого выявления проблем

## Технические детали

### DNS Resolver
- `127.0.0.11` - стандартный Docker DNS resolver
- `valid=30s` - время жизни DNS записей
- Автоматическое обновление IP адресов при перезапуске контейнеров

### Переменные nginx
- `set $backend_service "http://backend:8000"` - динамическое разрешение имени
- Позволяет nginx корректно обрабатывать изменения в Docker network

### Health Checks
- Backend: проверка `/api/health` endpoint
- Frontend: проверка `/health` endpoint
- TURN: проверка порта 3478
