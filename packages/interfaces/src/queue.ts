import type { JobsOptions } from 'bullmq'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IQueue {
  add(data: any, opts?: JobsOptions): Promise<void>
}
