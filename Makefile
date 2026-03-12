.PHONY: help build up down start stop restart logs ps clean env

# Переменные
COMPOSE = docker-compose

help: ## Показать справку по командам
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

env: ## Создать .env файл из .env.example, если он не существует
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env файл создан из .env.example"; \
	else \
		echo ".env файл уже существует"; \
	fi

build: ## Собрать Docker образы
	$(COMPOSE) build

up: env ## Запустить контейнеры в фоновом режиме
	$(COMPOSE) up -d

start: env ## Собрать образы и запустить контейнеры
	$(COMPOSE) up -d --build

stop: ## Остановить и удалить контейнеры
	$(COMPOSE) down

down: stop ## Алиас для stop

restart: stop up ## Перезапустить контейнеры

logs: ## Просмотреть логи контейнеров
	$(COMPOSE) logs -f

ps: ## Показать статус запущенных контейнеров
	$(COMPOSE) ps

clean: ## Удалить все контейнеры, образы и тома, связанные с проектом
	$(COMPOSE) down --rmi all --volumes --remove-orphans
