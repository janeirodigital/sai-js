import { ConsoleLogger, LoggerLevel, setLogger } from '@digita-ai/handlersjs-logging'

const logger = new ConsoleLogger('sai-server-tests', LoggerLevel.info, LoggerLevel.info)

setLogger(logger)
