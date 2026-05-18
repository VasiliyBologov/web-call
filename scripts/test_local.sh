#!/bin/bash

# Останавливаем скрипт при ошибке
set -e

# Конфигурация
IMAGE_NAME="web-call"
CONTAINER_NAME="web-call-app"
PORT=80

echo "🚀 Запуск локального тестового окружения Docker..."

# 1. Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Ошибка: Docker не установлен. Пожалуйста, установите его и попробуйте снова."
    exit 1
fi

# 2. Подготовка .env файла
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "📝 Создание .env из .env.example..."
        cp .env.example .env
    else
        echo "⚠️  Предупреждение: .env и .env.example не найдены. Будут использованы значения по умолчанию."
        touch .env
    fi
fi

# Загружаем переменные окружения для build-args
# Используем безопасный способ загрузки
if [ -f .env ]; then
    # Пропускаем комментарии и пустые строки
    export $(grep -v '^#' .env | xargs)
fi

# 3. Остановка старого контейнера
echo "🛑 Остановка существующего контейнера (если есть)..."
docker stop $CONTAINER_NAME >/dev/null 2>&1 || true
docker rm $CONTAINER_NAME >/dev/null 2>&1 || true

# 4. Сборка образа
echo "🛠 Сборка Docker образа $IMAGE_NAME..."
docker build \
    --build-arg VITE_API_BASE="${VITE_API_BASE:-}" \
    --build-arg VITE_WS_BASE="${VITE_WS_BASE:-}" \
    --build-arg VITE_ICE_JSON="${VITE_ICE_JSON:-}" \
    --build-arg VITE_ICE_TRANSPORT_POLICY="${VITE_ICE_TRANSPORT_POLICY:-all}" \
    --build-arg VITE_FORCE_H264="${VITE_FORCE_H264:-false}" \
    -t $IMAGE_NAME .

# 5. Запуск контейнера
echo "🏃 Запуск контейнера $CONTAINER_NAME на порту $PORT..."
docker run -d \
    --name $CONTAINER_NAME \
    --env-file .env \
    -p $PORT:80 \
    --restart unless-stopped \
    $IMAGE_NAME

echo ""
echo "✅ Готово! Приложение запущено."
echo "🌍 Ссылка: http://localhost:$PORT"
echo "📜 Логи: docker logs -f $CONTAINER_NAME"
echo "⏹ Остановить: docker stop $CONTAINER_NAME"
