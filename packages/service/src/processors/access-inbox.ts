import { SubscriptionClient } from '@solid-notifications/subscription';
import { NOTIFY } from '@janeirodigital/interop-utils';
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
    const subscriptionClient = new SubscriptionClient(saiSession.rawFetch as typeof fetch); // TODO: remove as
    const channel = await subscriptionClient.subscribe(
      saiSession.webIdProfile.hasAccessInbox,
      NOTIFY.WebhookChannel2023.value,
      webhookTargetUrl(webId, webId)
    );
    await this.sessionManager.setWebhookSubscription(webId, webId, channel);
  }
}
