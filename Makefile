.PHONY: help build up down start stop restart logs ps clean env

# Переменные
IMAGE_NAME := web-call
CONTAINER_NAME := web-call-app

help: ## Показать справку по командам
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' | sort

env: ## Создать .env файл из .env.example, если он не существует
	@if [ ! -f .env ]; then \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
			echo ".env файл создан из .env.example"; \
		else \
			echo "Ошибка: .env и .env.example не найдены"; \
			exit 1; \
		fi \
	else \
		echo ".env файл уже существует"; \
	fi

build: env ## Собрать Docker образ
	@set -a && . ./.env && set +a && \
	docker build \
		--build-arg VITE_API_BASE=$${VITE_API_BASE:-} \
		--build-arg VITE_WS_BASE=$${VITE_WS_BASE:-} \
		--build-arg VITE_ICE_JSON=$${VITE_ICE_JSON:-} \
		--build-arg VITE_ICE_TRANSPORT_POLICY=$${VITE_ICE_TRANSPORT_POLICY:-all} \
		--build-arg VITE_FORCE_H264=$${VITE_FORCE_H264:-false} \
		-t $(IMAGE_NAME) .

up: env ## Запустить контейнер в фоновом режиме
	@docker run -d \
		--name $(CONTAINER_NAME) \
		--env-file .env \
		-p 80:80 \
		--restart unless-stopped \
		$(IMAGE_NAME)

start: stop build up ## Собрать образ и запустить контейнер

start-lan: env ## Запустить с автоматическим определением локального IP для доступа по Wi-Fi
	@LOCAL_IP=$$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $$2}' | head -n 1); \
	echo "Определен локальный IP: $$LOCAL_IP"; \
	if [ -z "$$LOCAL_IP" ]; then echo "Ошибка: IP не найден"; exit 1; fi; \
	if [ "$$(uname)" = "Darwin" ]; then \
		sed -i '' "s|PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=http://$$LOCAL_IP|g" .env; \
	else \
		sed -i "s|PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=http://$$LOCAL_IP|g" .env; \
	fi; \
	$(MAKE) start

stop: ## Остановить и удалить контейнер
	@docker stop $(CONTAINER_NAME) >/dev/null 2>&1 || true
	@docker rm $(CONTAINER_NAME) >/dev/null 2>&1 || true

down: stop ## Алиас для stop

restart: stop up ## Перезапустить контейнер

logs: ## Просмотреть логи контейнера
	@docker logs -f $(CONTAINER_NAME)

ps: ## Показать статус запущенных контейнеров
	@docker ps -a --filter "name=$(CONTAINER_NAME)"

clean: stop ## Удалить контейнер и образ
	@docker rmi $(IMAGE_NAME) || true
