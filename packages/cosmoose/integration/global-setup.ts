import {
  AzureCosmosDbEmulatorContainer,
  type StartedAzureCosmosDbEmulatorContainer,
} from '@testcontainers/azure-cosmosdb-emulator';

const IMAGE = 'mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview';

let container: StartedAzureCosmosDbEmulatorContainer;

export async function setup () {
  container = await new AzureCosmosDbEmulatorContainer(IMAGE)
    .withProtocol('http')
    .start();

  process.env['COSMOS_ENDPOINT'] = container.getEndpoint();
  process.env['COSMOS_KEY'] = container.getKey();
}

export async function teardown () {
  await container?.stop();
}
