#!/bin/bash

# Скрипт для диагностики сетевых проблем web-call системы
# Использование: ./network_diagnostics.sh [host]

set -e

HOST=${1:-"localhost"}
BASE_URL="http://$HOST"

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

# Проверка базовой сетевой доступности
check_basic_connectivity() {
    print_header "Базовая сетевая доступность"
    
    # DNS резолвинг
    if nslookup "$HOST" > /dev/null 2>&1; then
        print_status "OK" "DNS резолвинг работает"
    else
        print_status "ERROR" "DNS резолвинг не работает"
        return 1
    fi
    
    # Ping тест
    if ping -c 3 "$HOST" > /dev/null 2>&1; then
        print_status "OK" "Ping до хоста работает"
    else
        print_status "WARN" "Ping до хоста не работает (возможно, заблокирован ICMP)"
    fi
    
    # Проверка портов
    for port in 80 8080; do
        if nc -z -w 5 "$HOST" "$port" 2>/dev/null; then
            print_status "OK" "Порт $port открыт"
        else
            print_status "ERROR" "Порт $port закрыт"
            return 1
        fi
    done
}

# Тест HTTP соединений
test_http_connections() {
    print_header "Тест HTTP соединений"
    
    # Тест базового HTTP
    if response=$(curl -s -w "%{http_code} %{time_total}" -o /dev/null "$BASE_URL" 2>/dev/null); then
        http_code=$(echo "$response" | cut -d' ' -f1)
        response_time=$(echo "$response" | cut -d' ' -f2)
        
        if [ "$http_code" = "200" ]; then
            print_status "OK" "HTTP ответ 200 (время: ${response_time}s)"
        else
            print_status "WARN" "HTTP ответ $http_code (время: ${response_time}s)"
        fi
    else
        print_status "ERROR" "HTTP соединение не работает"
        return 1
    fi
    
    # Тест API endpoints
    local endpoints=("/api/health" "/api/rooms")
    for endpoint in "${endpoints[@]}"; do
        if response=$(curl -s -w "%{http_code} %{time_total}" -o /dev/null "$BASE_URL$endpoint" 2>/dev/null); then
            http_code=$(echo "$response" | cut -d' ' -f1)
            response_time=$(echo "$response" | cut -d' ' -f2)
            
            if [ "$http_code" = "200" ] || [ "$http_code" = "405" ]; then
                print_status "OK" "API $endpoint доступен (код: $http_code, время: ${response_time}s)"
            else
                print_status "WARN" "API $endpoint вернул код $http_code (время: ${response_time}s)"
            fi
        else
            print_status "ERROR" "API $endpoint недоступен"
        fi
    done
}

# Тест WebSocket соединений
test_websocket_connections() {
    print_header "Тест WebSocket соединений"
    
    # Создаем тестовую комнату
    if ! response=$(curl -s -f -X POST "$BASE_URL/api/rooms" 2>/dev/null); then
        print_status "ERROR" "Не удалось создать комнату для теста WebSocket"
        return 1
    fi
    
    # Извлекаем token
    if command -v jq >/dev/null 2>&1; then
        token=$(echo "$response" | jq -r '.token' 2>/dev/null)
    else
        token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -z "$token" ] || [ "$token" = "null" ]; then
        print_status "ERROR" "Не удалось получить token комнаты"
        return 1
    fi
    
    echo "  - Тестируем WebSocket для комнаты: $token"
    
    # Проверяем WebSocket endpoint
    if curl -s -f -I "$BASE_URL/ws/rooms/$token" > /dev/null 2>&1; then
        print_status "OK" "WebSocket endpoint отвечает"
    else
        print_status "WARN" "WebSocket endpoint не отвечает (ожидается upgrade)"
    fi
}

# Тест производительности
test_performance() {
    print_header "Тест производительности"
    
    # Тест времени ответа
    echo "  - Тестируем время ответа API..."
    
    local total_time=0
    local success_count=0
    local test_count=5
    
    for i in $(seq 1 $test_count); do
        if response=$(curl -s -w "%{time_total}" -o /dev/null "$BASE_URL/api/health" 2>/dev/null); then
            response_time=$(echo "$response" | tail -1)
            total_time=$(echo "$total_time + $response_time" | bc -l 2>/dev/null || echo "$total_time + $response_time")
            success_count=$((success_count + 1))
            echo "    Попытка $i: ${response_time}s"
        else
            echo "    Попытка $i: неудачно"
        fi
    done
    
    if [ $success_count -gt 0 ]; then
        avg_time=$(echo "scale=3; $total_time / $success_count" | bc -l 2>/dev/null || echo "N/A")
        echo "  - Среднее время ответа: ${avg_time}s"
        
        if (( $(echo "$avg_time < 1.0" | bc -l 2>/dev/null || echo "1") )); then
            print_status "OK" "Производительность в норме"
        elif (( $(echo "$avg_time < 3.0" | bc -l 2>/dev/null || echo "1") )); then
            print_status "WARN" "Производительность снижена"
        else
            print_status "ERROR" "Производительность критически низкая"
        fi
    else
        print_status "ERROR" "Не удалось выполнить тесты производительности"
    fi
}

# Проверка SSL/TLS (если используется HTTPS)
check_ssl() {
    print_header "Проверка SSL/TLS"
    
    # Проверяем, используется ли HTTPS
    if [[ "$BASE_URL" == "https://"* ]]; then
        if command -v openssl >/dev/null 2>&1; then
            hostname=$(echo "$HOST" | cut -d: -f1)
            port=$(echo "$HOST" | cut -d: -f2)
            port=${port:-443}
            
            if openssl s_client -connect "$hostname:$port" -servername "$hostname" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
                print_status "OK" "SSL сертификат валиден"
            else
                print_status "WARN" "SSL сертификат имеет проблемы"
            fi
        else
            print_status "WARN" "OpenSSL не установлен для проверки сертификата"
        fi
    else
        print_status "OK" "HTTPS не используется (HTTP)"
    fi
}

# Проверка firewall и сетевых правил
check_firewall() {
    print_header "Проверка сетевых правил"
    
    # Проверяем доступность стандартных портов
    local ports=(80 443 8080)
    for port in "${ports[@]}"; do
        if nc -z -w 3 "$HOST" "$port" 2>/dev/null; then
            print_status "OK" "Порт $port доступен"
        else
            print_status "WARN" "Порт $port недоступен"
        fi
    done
    
    # Проверяем, не блокируется ли трафик
    if curl -s --connect-timeout 5 "$BASE_URL" > /dev/null 2>&1; then
        print_status "OK" "HTTP трафик не блокируется"
    else
        print_status "WARN" "HTTP трафик может блокироваться"
    fi
}

# Диагностика проблем с WebRTC
check_webrtc_issues() {
    print_header "Диагностика WebRTC"
    
    # Проверяем доступность TURN серверов (если настроены)
    if [ -n "$TURN_SERVER" ]; then
        echo "  - TURN сервер настроен: $TURN_SERVER"
        
        # Простая проверка доступности TURN сервера
        turn_host=$(echo "$TURN_SERVER" | sed 's/turn:\/\///' | cut -d: -f1)
        turn_port=$(echo "$TURN_SERVER" | sed 's/turn:\/\///' | cut -d: -f2)
        turn_port=${turn_port:-3478}
        
        if nc -z -w 5 "$turn_host" "$turn_port" 2>/dev/null; then
            print_status "OK" "TURN сервер доступен"
        else
            print_status "WARN" "TURN сервер недоступен"
        fi
    else
        print_status "WARN" "TURN сервер не настроен"
    fi
    
    # Проверяем STUN серверы
    local stun_servers=("stun:stun.l.google.com:19302" "stun:stun1.l.google.com:19302")
    for stun_server in "${stun_servers[@]}"; do
        stun_host=$(echo "$stun_server" | sed 's/stun:\/\///' | cut -d: -f1)
        stun_port=$(echo "$stun_server" | sed 's/stun:\/\///' | cut -d: -f2)
        
        if nc -z -w 3 "$stun_host" "$stun_port" 2>/dev/null; then
            print_status "OK" "STUN сервер $stun_host доступен"
        else
            print_status "WARN" "STUN сервер $stun_host недоступен"
        fi
    done
}

# Генерация отчета
generate_report() {
    print_header "Сетевой отчет"
    
    echo "Хост: $HOST"
    echo "Время проверки: $(date)"
    echo "Система: $(uname -s) $(uname -r)"
    
    if command -v curl >/dev/null 2>&1; then
        echo "curl версия: $(curl --version | head -1)"
    fi
    
    if command -v nc >/dev/null 2>&1; then
        echo "netcat доступен: да"
    else
        echo "netcat доступен: нет"
    fi
    
    echo ""
    echo "Рекомендации:"
    echo "1. Убедитесь, что все необходимые порты открыты в firewall"
    echo "2. Проверьте настройки DNS и сетевые маршруты"
    echo "3. Убедитесь, что TURN сервер настроен и доступен"
    echo "4. Проверьте логи nginx и backend для детальной диагностики"
}

# Основная функция
main() {
    echo "Диагностика сетевых проблем web-call системы"
    echo "============================================="
    
    local exit_code=0
    
    # Выполняем все проверки
    check_basic_connectivity || exit_code=1
    echo
    
    test_http_connections || exit_code=1
    echo
    
    test_websocket_connections || exit_code=1
    echo
    
    test_performance
    echo
    
    check_ssl
    echo
    
    check_firewall
    echo
    
    check_webrtc_issues
    echo
    
    generate_report
    echo
    
    # Итоговый результат
    print_header "Результат диагностики"
    if [ $exit_code -eq 0 ]; then
        print_status "OK" "Сетевые соединения работают корректно"
    else
        print_status "ERROR" "Обнаружены сетевые проблемы"
        echo "Проверьте настройки сети и firewall"
    fi
    
    exit $exit_code
}

# Запуск основной функции
main "$@"
