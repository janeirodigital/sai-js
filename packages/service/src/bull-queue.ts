import { IQueue } from '@janeirodigital/sai-server-interfaces';
import { Queue } from 'bullmq';
import { RedisConnectionInfo } from './redis-connection-info';

export class BullQueue implements IQueue {
  private bull: Queue;
  constructor(private name: string, info: RedisConnectionInfo) {
    this.bull = new Queue(name, { connection: info });
  }

  async add(data: any): Promise<void> {
    this.bull.add(this.name, data);
  }
}
