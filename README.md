# update-branch-bot

## Setup

### Step 1: Create a Github personal access token

To enable the bot to create pull request comments and access repositories, we need to create a [Github personal access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line). If the bot will operate on public repositories, the token should have the scope `public_repo`. If the bot will also operate on private repositories, the token should have the scope `repo`.

### Step 2: Deploy the bot

#### Option 1: Azure Functions

First, install the dependencies:

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools)

Next, create the Azure resources:

```sh
az group create --location <location> --name <name>
az group deployment create --resource-group <name> --template-file azuredeploy.json --parameters appName=<name> githubToken=<token> webhookSecret=<secret>
func azure functionapp fetch-app-settings <name>
```

Then, deploy the bot:

```sh
yarn install --prod
func azure functionapp publish <name>
```

The bot will be available at the URL `https://<name>.azurewebsites.net/api/AzGithubWebhook`

#### Option 2: Google Cloud Functions

First, install the dependencies:

Next, create the GCP resources and deploy the bot:

```sh
yarn install --prod
gcloud functions deploy GcpGithubWebhook --runtime nodejs8 --trigger-http --set-env-vars GITHUB_WEBHOOK_SECRET=<secret>,GITHUB_TOKEN=<token>,TOPIC_NAME=webhookqueue
gcloud functions deploy GcpWebhookWorker --trigger-topic webhookqueue --runtime nodejs8 --set-env-vars GITHUB_TOKEN=<token>
```

The bot will be available at the URL `https://<region>-<name>.cloudfunctions.net/GcpGithubWebhook`

### Step 3: Configure the Github webhook

```sh
curl 'https://api.github.com/repos/<organization>/<repository>/hooks' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '
  {
    "name": "web",
    "active": true,
    "events": [
      "push",
      "pull_request"
    ],
    "config": {
      "url": "<url>",
      "secret": "<secret>",
      "content_type": "json",
      "insecure_ssl": "0"
    }
  }
  '
```
