import type { IQueue } from '@janeirodigital/sai-server-interfaces'
import { type JobsOptions, Queue } from 'bullmq'
import type { RedisConnectionInfo } from './redis-connection-info'

export class BullQueue implements IQueue {
  private bull: Queue

  constructor(
    private name: string,
    info: RedisConnectionInfo
  ) {
    this.bull = new Queue(name, { connection: info })
  }

  async add(data: any, opts?: JobsOptions): Promise<void> {
    this.bull.add(this.name, data, opts)
  }
}
