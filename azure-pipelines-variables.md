# Azure DevOps Pipeline Variables

Этот документ описывает все необходимые переменные для корректной работы CI/CD пайплайна с TURN сервером.

## Обязательные переменные

### Frontend Configuration
- `VITE_API_BASE` - базовый URL для API (например: "https://yourdomain.com/api")
- `VITE_WS_BASE` - базовый URL для WebSocket (например: "wss://yourdomain.com/ws")
- `VITE_ICE_JSON` - JSON конфигурация ICE серверов (например: '[{"urls":"turn:yourdomain.com:3478","username":"user","credential":"secret123"}]'). По умолчанию используется внешний сервер 20.80.101.0.
- `VITE_ICE_TRANSPORT_POLICY` - политика ICE транспорта (например: "all", "relay")

### Backend Configuration
- `PUBLIC_BASE_URL` - публичный базовый URL приложения (например: "https://yourdomain.com")
- `LOG_TO_FILE` - включить логирование в файл (true/false)
- `WS_RETRY_ATTEMPTS` - количество попыток переподключения WebSocket (по умолчанию: 3)
- `WS_RETRY_DELAY` - задержка между попытками WebSocket (по умолчанию: 1.0)
- `WS_MAX_RETRY_DELAY` - максимальная задержка WebSocket (по умолчанию: 30.0)
- `PREVIEW_MAX_BYTES` - максимальный размер превью (по умолчанию: 300000)
- `PREVIEW_TTL_SECONDS` - TTL для превью в секундах (по умолчанию: 120)
- `TRUSTED_HOSTS` - список доверенных хостов (через запятую)



## Настройка в Azure DevOps

1. Перейдите в ваш проект Azure DevOps
2. Выберите Pipelines → Edit pipeline
3. Нажмите "Variables" в правом верхнем углу
4. Добавьте все необходимые переменные
5. Для секретных переменных (пароли) установите флаг "Keep this value secret"

## Пример значений для разработки

```bash
VITE_API_BASE=http://localhost:8000/api
VITE_WS_BASE=ws://localhost:8000/ws
VITE_ICE_JSON=[{"urls":"stun:20.80.101.0:3478"},{"urls":["turn:20.80.101.0:3478?transport=udp","turn:20.80.101.0:3478?transport=tcp"],"username":"testuser","credential":"testpassword"}]
VITE_ICE_TRANSPORT_POLICY=all
PUBLIC_BASE_URL=http://localhost:5173
LOG_TO_FILE=false
```

## Пример значений для продакшена

```bash
VITE_API_BASE=https://yourdomain.com/api
VITE_WS_BASE=wss://yourdomain.com/ws
VITE_ICE_JSON=[{"urls":"stun:20.80.101.0:3478"},{"urls":["turn:20.80.101.0:3478?transport=udp","turn:20.80.101.0:3478?transport=tcp"],"username":"testuser","credential":"testpassword"}]
VITE_ICE_TRANSPORT_POLICY=relay
PUBLIC_BASE_URL=https://yourdomain.com
LOG_TO_FILE=true
```

## Проверка переменных

Пайплайн автоматически проверяет наличие обязательных переменных на этапе валидации. Если какая-то переменная не установлена, вы получите предупреждение в логах пайплайна.

## Безопасность

- Никогда не коммитьте секретные переменные в код
- Используйте Azure Key Vault для хранения секретов в продакшене
- Регулярно ротируйте пароли и ключи
- Ограничьте доступ к переменным пайплайна только необходимыми пользователями
