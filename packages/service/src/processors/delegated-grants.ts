import type { IProcessor, ISessionManager } from '@janeirodigital/sai-server-interfaces'
import type { IDelegatedGrantsJob } from '../models/jobs'

export class DelegatedGrantsProcessor implements IProcessor {
  constructor(public sessionManager: ISessionManager) {}

  async processorFunction(job: IDelegatedGrantsJob): Promise<void> {
    const { webId, registeredAgent } = job.data
    const saiSession = await this.sessionManager.getSaiSession(webId)
    await saiSession.updateDelegatedGrants(registeredAgent)
  }
}
