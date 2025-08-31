#!/bin/bash

# Скрипт для проверки здоровья web-call системы
# Использование: ./health_check.sh [host]

set -e

HOST=${1:-"localhost"}
BASE_URL="http://$HOST"
WS_URL="ws://$HOST"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✓ $message${NC}"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠ $message${NC}"
    else
        echo -e "${RED}✗ $message${NC}"
    fi
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Проверка доступности nginx
check_nginx() {
    print_header "Проверка Nginx"
    
    if curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
        print_status "OK" "Nginx health endpoint доступен"
    else
        print_status "ERROR" "Nginx health endpoint недоступен"
        return 1
    fi
    
    # Проверка статуса nginx
    if curl -s -f "$BASE_URL:8080/nginx_status" > /dev/null 2>&1; then
        print_status "OK" "Nginx status endpoint доступен"
    else
        print_status "WARN" "Nginx status endpoint недоступен"
    fi
}

# Проверка backend API
check_backend_api() {
    print_header "Проверка Backend API"
    
    # Проверка health endpoint
    if response=$(curl -s -f "$BASE_URL/api/health" 2>/dev/null); then
        print_status "OK" "Backend health endpoint доступен"
        
        # Парсинг JSON ответа
        if command -v jq >/dev/null 2>&1; then
            status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "unknown")
            uptime=$(echo "$response" | jq -r '.metrics.uptime_seconds' 2>/dev/null || echo "0")
            active_connections=$(echo "$response" | jq -r '.metrics.active_connections' 2>/dev/null || echo "0")
            
            echo "  - Статус: $status"
            echo "  - Время работы: ${uptime}s"
            echo "  - Активные соединения: $active_connections"
            
            if [ "$status" = "unhealthy" ]; then
                print_status "ERROR" "Backend сообщает о проблемах"
                return 1
            elif [ "$status" = "degraded" ]; then
                print_status "WARN" "Backend работает с деградацией"
            fi
        else
            echo "  - Ответ получен (jq не установлен для детального анализа)"
        fi
    else
        print_status "ERROR" "Backend health endpoint недоступен"
        return 1
    fi
    
    # Проверка создания комнаты
    if response=$(curl -s -f -X POST "$BASE_URL/api/rooms" 2>/dev/null); then
        print_status "OK" "Создание комнаты работает"
        
        if command -v jq >/dev/null 2>&1; then
            token=$(echo "$response" | jq -r '.token' 2>/dev/null)
            if [ "$token" != "null" ] && [ -n "$token" ]; then
                echo "  - Тестовая комната создана: $token"
                
                # Проверка получения информации о комнате
                if curl -s -f "$BASE_URL/api/rooms/$token" > /dev/null 2>&1; then
                    print_status "OK" "Получение информации о комнате работает"
                else
                    print_status "ERROR" "Получение информации о комнате не работает"
                    return 1
                fi
            fi
        fi
    else
        print_status "ERROR" "Создание комнаты не работает"
        return 1
    fi
}

# Проверка WebSocket
check_websocket() {
    print_header "Проверка WebSocket"
    
    # Создаем временную комнату для теста
    if ! response=$(curl -s -f -X POST "$BASE_URL/api/rooms" 2>/dev/null); then
        print_status "ERROR" "Не удалось создать комнату для теста WebSocket"
        return 1
    fi
    
    if command -v jq >/dev/null 2>&1; then
        token=$(echo "$response" | jq -r '.token' 2>/dev/null)
    else
        # Простая парсинг без jq
        token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_status "ERROR" "Не удалось получить token комнаты"
        return 1
    fi
    
    echo "  - Тестируем WebSocket для комнаты: $token"
    
    # Проверяем WebSocket endpoint (базовая проверка)
    if curl -s -f -I "$BASE_URL/ws/rooms/$token" > /dev/null 2>&1; then
        print_status "OK" "WebSocket endpoint доступен"
    else
        print_status "WARN" "WebSocket endpoint недоступен (возможно, ожидается upgrade)"
    fi
}

# Проверка сетевых соединений
check_network() {
    print_header "Проверка сетевых соединений"
    
    # Проверка DNS
    if nslookup "$HOST" > /dev/null 2>&1; then
        print_status "OK" "DNS резолвинг работает"
    else
        print_status "WARN" "DNS резолвинг не работает"
    fi
    
    # Проверка ping
    if ping -c 1 "$HOST" > /dev/null 2>&1; then
        print_status "OK" "Ping до хоста работает"
    else
        print_status "WARN" "Ping до хоста не работает"
    fi
    
    # Проверка портов
    if nc -z "$HOST" 80 2>/dev/null; then
        print_status "OK" "Порт 80 (HTTP) открыт"
    else
        print_status "ERROR" "Порт 80 (HTTP) закрыт"
        return 1
    fi
    
    if nc -z "$HOST" 8080 2>/dev/null; then
        print_status "OK" "Порт 8080 (Nginx status) открыт"
    else
        print_status "WARN" "Порт 8080 (Nginx status) закрыт"
    fi
}

# Проверка Docker контейнеров (если запущены через Docker)
check_docker() {
    print_header "Проверка Docker контейнеров"
    
    if ! command -v docker >/dev/null 2>&1; then
        print_status "WARN" "Docker не установлен"
        return 0
    fi
    
    # Проверяем запущенные контейнеры
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "web-call"; then
        print_status "OK" "Контейнеры web-call запущены"
        
        # Детальная информация о контейнерах
        echo "  - Активные контейнеры:"
        docker ps --format "    {{.Names}}: {{.Status}}" | grep web-call || true
    else
        print_status "WARN" "Контейнеры web-call не найдены"
    fi
    
    # Проверка логов на ошибки
    if docker logs web-call-frontend-1 2>&1 | grep -i error | tail -5 > /tmp/frontend_errors 2>/dev/null; then
        if [ -s /tmp/frontend_errors ]; then
            print_status "WARN" "Найдены ошибки в логах frontend"
            echo "  - Последние ошибки:"
            cat /tmp/frontend_errors | sed 's/^/    /'
        fi
    fi
    
    if docker logs web-call-backend-1 2>&1 | grep -i error | tail -5 > /tmp/backend_errors 2>/dev/null; then
        if [ -s /tmp/backend_errors ]; then
            print_status "WARN" "Найдены ошибки в логах backend"
            echo "  - Последние ошибки:"
            cat /tmp/backend_errors | sed 's/^/    /'
        fi
    fi
    
    # Очистка временных файлов
    rm -f /tmp/frontend_errors /tmp/backend_errors
}

# Основная функция
main() {
    echo "Проверка здоровья web-call системы на $HOST"
    echo "================================================"
    
    local exit_code=0
    
    # Выполняем все проверки
    check_network || exit_code=1
    echo
    
    check_nginx || exit_code=1
    echo
    
    check_backend_api || exit_code=1
    echo
    
    check_websocket || exit_code=1
    echo
    
    check_docker
    echo
    
    # Итоговый результат
    print_header "Результат проверки"
    if [ $exit_code -eq 0 ]; then
        print_status "OK" "Все основные проверки пройдены успешно"
        echo "Система работает корректно"
    else
        print_status "ERROR" "Обнаружены проблемы в системе"
        echo "Проверьте логи и настройки"
    fi
    
    exit $exit_code
}

# Запуск основной функции
main "$@"
