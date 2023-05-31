/* eslint-disable class-methods-use-this */

import type { IProcessor, ISessionManager } from '@janeirodigital/sai-server-interfaces';
import type { IPushNotificationsJob } from '../models/jobs';
// import { sendWebPush } from "../services";

export class PushNotificationsProcessor implements IProcessor {
  constructor(public sessionManager: ISessionManager) {}

  async processorFunction(job: IPushNotificationsJob): Promise<void> {
    // TODO https://github.com/janeirodigital/sai-impl-service/issues/71
    // const { webId } = job.data
    // const saiSession = await this.sessionManager.getSaiSession(webId)
    // if (peerWebId) {
    //   const pushSubscriptions = await this.sessionManager.getPushSubscriptions(webId)
    //   sendWebPush(peerWebId, pushSubscriptions)
    // }
  }
}
