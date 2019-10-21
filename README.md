# update-branch-bot

## Deploy to Azure

First, install the dependencies:

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools)

Next, create the Azure resources:

```sh
az group create --location <location> --name <name>
az group deployment create --resource-group <name> --template-file azuredeploy.json --parameters appName=<name> githubToken=<token> webhookSecret=<secret>
```

Then, deploy the bot:

```sh
yarn install --prod
func azure functionapp publish <name>
```

The bot will be available at the URL `https://<name>.azurewebsites.net/api/AzGithubWebhook`
