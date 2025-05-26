import type { IProcessor, ISessionManager } from '@janeirodigital/sai-server-interfaces'
import type { IPushNotificationsJob } from '../models/jobs'
import { sendWebPush } from '../services'

export class PushNotificationsProcessor implements IProcessor {
  constructor(public sessionManager: ISessionManager) {}

  async processorFunction(job: IPushNotificationsJob): Promise<void> {
    const { webId, registeredAgent } = job.data
    const saiSession = await this.sessionManager.getSaiSession(webId)
    const socialAgentRegistration = await saiSession.findSocialAgentRegistration(registeredAgent)
    if (!socialAgentRegistration)
      throw new Error(`social agent registration not found: ${registeredAgent}`)
    const pushSubscriptions = await this.sessionManager.getPushSubscriptions(webId)
    sendWebPush(socialAgentRegistration, pushSubscriptions)
  }
}
