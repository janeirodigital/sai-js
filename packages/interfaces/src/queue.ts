import type { JobsOptions } from 'bullmq'

export interface IQueue {
  add(data: any, opts?: JobsOptions): Promise<void>
}
