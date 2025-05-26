import type { ISessionManager } from './i-session-manager'

export interface IWorker {
  run(): Promise<void>
}

export type IProcessorFunction = (job: any) => Promise<void>

export interface IProcessor {
  sessionManager: ISessionManager
  processorFunction: IProcessorFunction
}
