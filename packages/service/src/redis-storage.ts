import type { IStorage } from '@inrupt/solid-client-authn-node'
import { Redis } from 'ioredis'
import type { RedisConnectionInfo } from './redis-connection-info'

export class RedisSolidStorage implements IStorage {
  private client

  public constructor(info: RedisConnectionInfo) {
    this.client = new Redis(info)
  }

  async delete(key: string): Promise<void> {
    try {
      const result = await this.client.del(key).then()
      if (result > 0) return

      // ??
    } catch (e) {}
  }

  async get(key: string): Promise<string | undefined> {
    try {
      const value = await this.client.get(key)
      return value || undefined
    } catch (e) {
      return undefined
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      const result = await this.client.set(key, value)
      if (result === 'OK') return
    } catch (e) {}
  }
}
