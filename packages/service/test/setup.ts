import { ConsoleLogger, setLogger, LoggerLevel } from '@digita-ai/handlersjs-logging';

const logger = new ConsoleLogger('sai-server-tests', LoggerLevel.info, LoggerLevel.info);

setLogger(logger);
