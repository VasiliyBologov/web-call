# Azure DevOps Pipeline Setup with TURN Server

Этот документ описывает настройку и использование CI/CD пайплайна для развертывания web-call приложения с TURN сервером в Azure.

## Обзор архитектуры

Пайплайн включает следующие этапы:

1. **Validate** - валидация конфигурации и переменных окружения
2. **Build** - сборка и публикация образов в Azure Container Registry
3. **Test** - тестирование приложения
4. **Deploy** - развертывание в Azure Web App
5. **PostDeploy** - пост-деплой проверка

## Предварительные требования

### Azure Resources
- Azure Container Registry (ACR)
- Azure Web App с поддержкой multi-container
- Azure Resource Group
- Azure DevOps проект с настроенным service connection

### Azure DevOps Variables
Убедитесь, что все необходимые переменные настроены в Azure DevOps:

```bash
# TURN Server
TURN_USERNAME=your_turn_username
TURN_PASSWORD=your_turn_password
TURN_REALM=your_domain.com

# Frontend
VITE_API_BASE=https://your_domain.com/api
VITE_WS_BASE=wss://your_domain.com/ws
VITE_ICE_JSON=[{"urls":"turn:your_domain.com:3478","username":"your_turn_username","credential":"your_turn_password"}]
VITE_ICE_TRANSPORT_POLICY=relay

# Backend
PUBLIC_BASE_URL=https://your_domain.com
LOG_TO_FILE=true


```

## Настройка пайплайна

### 1. Создание пайплайна

1. В Azure DevOps перейдите в Pipelines → New Pipeline
2. Выберите Azure Repos Git
3. Выберите ваш репозиторий
4. Выберите "Existing Azure Pipelines YAML file"
5. Укажите путь: `/azure-pipelines.yml`

### 2. Настройка переменных

1. В пайплайне нажмите "Variables"
2. Добавьте все необходимые переменные
3. Для секретных переменных установите "Keep this value secret"

### 3. Настройка Service Connection

Убедитесь, что у вас настроен Azure Resource Manager service connection с именем, указанным в переменной `azureSubscription`.

## Структура пайплайна

### Stage: Validate
- Проверяет корректность docker-compose.yml
- Валидирует наличие обязательных переменных окружения
- Проверяет синтаксис конфигурации

### Stage: Build
- Собирает backend образ в ACR
- Собирает frontend образ в ACR с переменными окружения
- Собирает TURN сервер образ в ACR
- Генерирует docker-compose.azure.yaml для Azure

### Stage: Test
- Тестирует сгенерированную конфигурацию
- Выполняет smoke tests
- Проверяет работоспособность компонентов

### Stage: Deploy
- Развертывает приложение в Azure Web App
- Настраивает переменные окружения
- Запускает все сервисы (frontend, backend, TURN)

### Stage: PostDeploy
- Проверяет здоровье развернутых сервисов
- Валидирует доступность TURN сервера

## TURN Server в Azure

### Особенности развертывания

1. **UDP порты**: TURN сервер требует UDP порты 3478 и 50000-50100
2. **Network Security Groups**: Убедитесь, что NSG разрешает UDP трафик
3. **Load Balancer**: Настройте Azure Load Balancer для UDP трафика

### Конфигурация NSG

Создайте правила в Network Security Group:

```bash
# TURN TCP
Priority: 1000, Port: 3478, Protocol: TCP, Action: Allow

# TURN UDP
Priority: 1001, Port: 3478, Protocol: UDP, Action: Allow

# TURN Media Ports
Priority: 1002, Port: 50000-50100, Protocol: UDP, Action: Allow
```



## Troubleshooting

### Частые проблемы

1. **TURN сервер недоступен**
   - Проверьте NSG правила
   - Убедитесь, что UDP порты открыты
   - Проверьте логи контейнера

2. **Переменные окружения не установлены**
   - Проверьте настройки в Azure DevOps
   - Убедитесь, что переменные не пустые

3. **Проблемы с развертыванием**
   - Проверьте логи Azure Web App
   - Убедитесь, что ACR доступен
   - Проверьте права доступа service connection

### Логи и отладка

```bash
# Логи TURN сервера
docker logs webcall-turn

# Логи backend
docker logs webcall-backend

# Логи frontend
docker logs webcall-frontend

# Проверка статуса сервисов
docker-compose ps
```

## Тестирование

### Локальное тестирование

```bash
# Запуск с TURN сервером
docker-compose up -d

# Тестирование TURN сервера
./scripts/test_turn_azure.sh

# Остановка
docker-compose down
```

### Тестирование в Azure

После развертывания используйте скрипт тестирования:

```bash
# Установите переменные окружения
export TURN_SERVER=your_azure_domain.com
export TURN_USERNAME=your_username
export TURN_PASSWORD=your_password

# Запустите тест
./scripts/test_turn_azure.sh
```

## Безопасность

### Рекомендации

1. **Секреты**: Используйте Azure Key Vault для хранения секретов
2. **Сеть**: Ограничьте доступ к TURN серверу только необходимыми IP
3. **Аутентификация**: Используйте сложные пароли для TURN сервера
4. **Мониторинг**: Включите логирование и мониторинг всех сервисов

### Azure Key Vault интеграция

Для продакшена рекомендуется использовать Azure Key Vault:

```bash
# Получение секретов из Key Vault
az keyvault secret show --vault-name your-vault --name turn-password
```

## Обновление пайплайна

При изменении конфигурации:

1. Обновите `azure-pipelines.yml`
2. Проверьте переменные окружения
3. Протестируйте локально
4. Запустите пайплайн в Azure DevOps

## Поддержка

При возникновении проблем:

1. Проверьте логи пайплайна в Azure DevOps
2. Изучите логи развернутых сервисов
3. Проверьте настройки Azure ресурсов
4. Обратитесь к документации Azure DevOps
