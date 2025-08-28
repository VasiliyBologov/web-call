#!/usr/bin/env bash
set -euo pipefail

# Azure bootstrap script: creates Resource Group, ACR, Linux App Service Plan, and Web App for Containers.
# It also enables system-assigned managed identity on the Web App and grants it AcrPull role on the ACR.
#
# Prerequisites:
# - Azure CLI installed and logged in: az login
# - Appropriate subscription selected: az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"
#
# Usage:
#   ./scripts/azure_create_acr_and_webapp.sh \
#       --location westeurope \
#       --resource-group my-rg-webcall \
#       --acr-name mywebcallacr \
#       --plan-name my-webcall-plan \
#       --plan-sku P1v3 \
#       --webapp-name my-webcall-app
#
# Notes:
# - ACR name must be globally unique, 5-50 alphanumeric, start/end with letter/number.
# - Web App name must be globally unique in Azure App Service.
# - Suggested SKUs: B1 (basic), S1 (standard), P1v3 (prod). For testing, use B1/S1; for production, consider P1v3.
# - The pipeline azure-pipelines.yml expects variables: AZURE_SERVICE_CONNECTION (AzureRM service connection name), acrName, webAppName, resourceGroup.

# Default values (can be overridden by flags)
LOCATION="westeurope"
RESOURCE_GROUP=""
ACR_NAME=""
PLAN_NAME="webcall-plan"
PLAN_SKU="S1"
WEBAPP_NAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --location)
      LOCATION="$2"; shift 2 ;;
    --resource-group)
      RESOURCE_GROUP="$2"; shift 2 ;;
    --acr-name)
      ACR_NAME="$2"; shift 2 ;;
    --plan-name)
      PLAN_NAME="$2"; shift 2 ;;
    --plan-sku)
      PLAN_SKU="$2"; shift 2 ;;
    --webapp-name)
      WEBAPP_NAME="$2"; shift 2 ;;
    -h|--help)
      grep -E '^(# |Usage:|# - )' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$RESOURCE_GROUP" || -z "$ACR_NAME" || -z "$WEBAPP_NAME" ]]; then
  echo "ERROR: --resource-group, --acr-name, and --webapp-name are required." >&2
  exit 1
fi

# Confirm Azure CLI is available
if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI (az) not found. Install from https://learn.microsoft.com/cli/azure/install-azure-cli" >&2
  exit 1
fi

# Ensure login
if ! az account show >/dev/null 2>&1; then
  echo "You are not logged in. Run: az login" >&2
  exit 1
fi

SUB_ID=$(az account show --query id -o tsv)
echo "Using subscription: $SUB_ID"

echo "Creating resource group: $RESOURCE_GROUP in $LOCATION"
az group create -n "$RESOURCE_GROUP" -l "$LOCATION" -o none

# Create ACR (Basic SKU is affordable for tests)
echo "Creating ACR (Basic): $ACR_NAME"
az acr create -n "$ACR_NAME" -g "$RESOURCE_GROUP" --sku Basic -o none

ACR_ID=$(az acr show -n "$ACR_NAME" --query id -o tsv)
ACR_LOGIN_SERVER=$(az acr show -n "$ACR_NAME" --query loginServer -o tsv)

# Create Linux App Service Plan
# Note: For production, consider Premium v3 (P1v3) for better performance and TLS 1.3 etc.
echo "Creating Linux App Service Plan: $PLAN_NAME ($PLAN_SKU)"
az appservice plan create -g "$RESOURCE_GROUP" -n "$PLAN_NAME" --is-linux --sku "$PLAN_SKU" -o none

# Create Web App for Containers (Linux)
echo "Creating Web App: $WEBAPP_NAME"
az webapp create -g "$RESOURCE_GROUP" -p "$PLAN_NAME" -n "$WEBAPP_NAME" --runtime "PYTHON:3.11" -o none

# Enable system-assigned managed identity on the Web App
echo "Enabling system-assigned managed identity on $WEBAPP_NAME"
IDENTITY_JSON=$(az webapp identity assign -g "$RESOURCE_GROUP" -n "$WEBAPP_NAME")
PRINCIPAL_ID=$(echo "$IDENTITY_JSON" | jq -r '.principalId') || true
if [[ -z "${PRINCIPAL_ID:-}" || "$PRINCIPAL_ID" == "null" ]]; then
  # fallback without jq
  PRINCIPAL_ID=$(az webapp identity show -g "$RESOURCE_GROUP" -n "$WEBAPP_NAME" --query principalId -o tsv)
fi

# Grant AcrPull to the Web App's managed identity on ACR
echo "Granting AcrPull role to Web App identity on ACR"
az role assignment create --assignee "$PRINCIPAL_ID" --scope "$ACR_ID" --role "AcrPull" -o none

# Configure basic app settings helpful for our compose deployment
echo "Setting common app settings"
az webapp config appsettings set -g "$RESOURCE_GROUP" -n "$WEBAPP_NAME" --settings \
  WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
  DOCKER_REGISTRY_SERVER_URL="https://$ACR_LOGIN_SERVER" -o none

cat <<EOF
---
Azure resources created successfully.

Next steps:
1) In Azure DevOps, create an ARM service connection (Azure Resource Manager) to this subscription/resource group.
2) In your pipeline variables, set:
   - AZURE_SERVICE_CONNECTION = <Name of your ARM service connection>
   - resourceGroup = $RESOURCE_GROUP
   - acrName = $ACR_NAME
   - webAppName = $WEBAPP_NAME
3) Run the pipeline. It will build images in ACR ($ACR_LOGIN_SERVER) and deploy docker-compose to the Web App.

Info:
- ACR Login Server: $ACR_LOGIN_SERVER
- Resource Group:   $RESOURCE_GROUP
- Web App:          $WEBAPP_NAME
- App Service Plan: $PLAN_NAME ($PLAN_SKU)
- Subscription:     $SUB_ID
---
EOF
