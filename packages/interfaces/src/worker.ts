import type { ISessionManager } from './i-session-manager'

export interface IWorker {
  run(): Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IProcessorFunction = (job: any) => Promise<void>

export interface IProcessor {
  sessionManager: ISessionManager
  processorFunction: IProcessorFunction
}
