import path from 'path';
import yargs from 'yargs/yargs';
import { ComponentsManager, IComponentsManagerBuilderOptions } from 'componentsjs';
import type { Server, NodeHttpServer } from '@digita-ai/handlersjs-http';
import { ConsoleLogger, setLogger, LoggerLevel } from '@digita-ai/handlersjs-logging';
import { IWorker } from '@janeirodigital/sai-server-interfaces';

const logger = new ConsoleLogger('sai-server', LoggerLevel.warn, LoggerLevel.warn);

setLogger(logger);

const argv = yargs(process.argv.slice(2))
  .options({
    config: { type: 'string', default: 'config/development.json' }
  })
  .parseSync();

export async function createServer(): Promise<{ server: Server; workers: IWorker[] }> {
  const modulePath = path.join(__dirname, '..');
  const configFile = path.join(modulePath, argv.config);

  const managerProperties: IComponentsManagerBuilderOptions<Server> = {
    mainModulePath: modulePath,
    dumpErrorState: false,
    logLevel: 'debug'
  };

  // Setup ComponentsJS
  const componentsManager = await ComponentsManager.build(managerProperties);
  await componentsManager.configRegistry.register(configFile);

  const workerIris = [
    'urn:solid:authorization-agent:worker:ReciprocalRegistrations',
    'urn:solid:authorization-agent:worker:AccessInbox',
    'urn:solid:authorization-agent:worker:DelegatedGrants',
    'urn:solid:authorization-agent:worker:PushNotifications'
  ];
  const workers = await Promise.all(workerIris.map((workerIri) => componentsManager.instantiate<IWorker>(workerIri)));

  const serviceIri = 'urn:solid:authorization-agent:default:Service';
  const service = await componentsManager.instantiate<NodeHttpServer>(serviceIri);
  return { server: service, workers };
}

createServer().then(async ({ server, workers }) => {
  await Promise.all(workers.map((worker) => worker.run()));
  server.start();
  logger.info('Server started');
});
