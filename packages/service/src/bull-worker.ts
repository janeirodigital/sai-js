import type { IProcessor, IWorker } from '@janeirodigital/sai-server-interfaces'
import { Worker } from 'bullmq'
import type { RedisConnectionInfo } from './redis-connection-info'

export class BullWorker implements IWorker {
  private bull: Worker

  constructor(queueName: string, processor: IProcessor, info: RedisConnectionInfo) {
    this.bull = new Worker(queueName, processor.processorFunction.bind(processor), {
      autorun: false,
      connection: info,
    })
  }

  async run() {
    this.bull.run()
  }
}
