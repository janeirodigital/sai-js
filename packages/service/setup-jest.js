/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
const { ConsoleLogger, setLogger, LoggerLevel } = require('@digita-ai/handlersjs-logging');

const logger = new ConsoleLogger('sai-server-tests', LoggerLevel.info, LoggerLevel.info);

setLogger(logger);
