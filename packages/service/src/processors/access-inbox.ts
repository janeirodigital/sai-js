import { subscribe } from 'solid-webhook-client';
import type { IProcessor, ISessionManager } from '@janeirodigital/sai-server-interfaces';
import type { IAccessInboxJob } from '../models/jobs';
import { webhookTargetUrl } from '../url-templates';

export class AccessInboxProcessor implements IProcessor {
  constructor(public sessionManager: ISessionManager) {}

  async processorFunction(job: IAccessInboxJob): Promise<void> {
    const { webId } = job.data;
    const saiSession = await this.sessionManager.getSaiSession(webId);

    if (await this.sessionManager.getWebhookSubscription(webId, webId)) return;
    if (!saiSession.webIdProfile?.hasAccessInbox) return;

    const subsciption = await subscribe(saiSession.webIdProfile.hasAccessInbox, webhookTargetUrl(webId, webId), {
      fetch: saiSession.rawFetch
    });
    await this.sessionManager.setWebhookSubscription(webId, webId, subsciption);
  }
}
