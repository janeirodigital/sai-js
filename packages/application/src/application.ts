import { SubscriptionClient } from '@solid-notifications/subscription';
import type { NotificationChannel } from '@solid-notifications/types';
import {
  ApplicationFactory,
  ReadableApplicationRegistration,
  DataOwner,
  SelectedFromRegistryDataGrant,
  AllFromRegistryDataGrant,
  DataGrant,
  InheritedDataGrant
} from '@janeirodigital/interop-data-model';
import {
  WhatwgFetch,
  RdfFetch,
  fetchWrapper,
  discoverAuthorizationAgent,
  discoverAgentRegistration,
  discoverAuthorizationRedirectEndpoint,
  NOTIFY,
  discoverWebPushService,
  ACL,
  discoverDescriptionResource
} from '@janeirodigital/interop-utils';

interface ApplicationDependencies {
  fetch: WhatwgFetch;
  randomUUID(): string;
}

type ParentInfo = {
  id: string;
  scope: string;
  resourceServer: string;
};

type ChildInfo = {
  id: string;
  scope: string;
  resourceServer: string;
  parent: string;
};

export interface SaiEvent {
  type: string;
}

export class Application {
  factory: ApplicationFactory;

  rawFetch: WhatwgFetch;

  fetch: RdfFetch;

  private transformStream: TransformStream;

  private writeableStream: WritableStream<SaiEvent>;

  public stream: ReadableStream<SaiEvent>;

  authorizationAgentIri: string;

  authorizationRedirectEndpoint: string;

  webPushService?: { id: string; vapidPublicKey: string };

  registrationIri: string;

  // TODO rename
  hasApplicationRegistration?: ReadableApplicationRegistration;

  public parentMap: Map<string, ParentInfo> = new Map();

  public childMap: Map<string, ChildInfo> = new Map();

  constructor(
    public webId: string,
    public applicationId: string,
    dependencies: ApplicationDependencies
  ) {
    this.rawFetch = dependencies.fetch;
    this.fetch = fetchWrapper(this.rawFetch);
    this.factory = new ApplicationFactory({ fetch: this.fetch, randomUUID: dependencies.randomUUID });
    this.transformStream = new TransformStream();
    this.stream = this.transformStream.readable;
    this.writeableStream = this.transformStream.writable;
  }

  private async bootstrap(): Promise<void> {
    this.authorizationAgentIri = await discoverAuthorizationAgent(this.webId, this.fetch);
    this.registrationIri = await discoverAgentRegistration(this.authorizationAgentIri, this.rawFetch);
    this.authorizationRedirectEndpoint = await discoverAuthorizationRedirectEndpoint(
      this.authorizationAgentIri,
      this.rawFetch
    );
    // TODO: avoid double fetch
    this.webPushService = await discoverWebPushService(this.authorizationAgentIri, this.rawFetch);
    if (!this.registrationIri) return;
    await this.buildRegistration();
    await this.subscribeToRegistration();
  }

  private async buildRegistration(): Promise<void> {
    if (this.registrationIri) {
      this.hasApplicationRegistration = await this.factory.readable.applicationRegistration(this.registrationIri);
    }
  }

  // TODO: fail gracefully
  private async subscribeToRegistration(): Promise<void> {
    const subscriptionClient = new SubscriptionClient(this.fetch);
    let channel: NotificationChannel;
    try {
      channel = await subscriptionClient.subscribe(this.registrationIri, NOTIFY.WebSocketChannel2023.value);
    } catch {
      return;
    }
    // TODO: move Web Socket to a Web Worker
    const websocket = new WebSocket(channel.receiveFrom);
    websocket.onmessage = async (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === 'Update') {
        await this.buildRegistration();
        this.writeableStream.getWriter().write({ type: 'GRANT' });
      }
    };
  }

  async subscribeViaPush(subscription: PushSubscription, topic: string): Promise<NotificationChannel> {
    if (!this.webPushService) throw new Error('Web Push Service not found');
    const channel = {
      '@context': [
        'https://www.w3.org/ns/solid/notifications-context/v1',
        {
          notify: 'http://www.w3.org/ns/solid/notifications#'
        }
      ],
      type: 'notify:WebPushChannel2023',
      topic,
      sendTo: subscription.endpoint,
      'notify:keys': {
        'notify:auth': subscription.toJSON()['keys']['auth'],
        'notify:p256dh': subscription.toJSON()['keys']['p256dh']
      }
    };
    const response = await this.fetch(this.webPushService.id, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json'
      },
      body: JSON.stringify(channel)
    });
    if (!response.ok) {
      throw new Error('Failed to subscribe via push');
    }
    return response.json();
  }

  async unsubscribeFromPush(topic: string, channelId: string): Promise<boolean> {
    const response = await this.rawFetch(channelId, { method: 'DELETE' });
    return response.ok;
  }

  get authorizationRedirectUri(): string {
    return `${this.authorizationRedirectEndpoint}?client_id=${encodeURIComponent(this.applicationId)}`;
  }

  getShareUri(resourceIri: string): string {
    return `${this.authorizationRedirectEndpoint}?resource=${encodeURIComponent(
      resourceIri
    )}&client_id=${encodeURIComponent(this.applicationId)}`;
  }

  static async build(
    webId: string,
    applicationId: string,
    dependencies: ApplicationDependencies
  ): Promise<Application> {
    const application = new Application(webId, applicationId, dependencies);
    await application.bootstrap();
    return application;
  }

  /**
   * Array of DataOwner instances out of all the data application can access.
   * @public
   */
  get dataOwners(): DataOwner[] {
    if (!this.hasApplicationRegistration) return [];
    return this.hasApplicationRegistration.hasAccessGrant.hasDataGrant.reduce((acc, grant) => {
      let owner: DataOwner = acc.find((agent) => agent.iri === grant.dataOwner);
      if (!owner) {
        owner = new DataOwner(grant.dataOwner);
        acc.push(owner);
      }
      owner.issuedGrants.push(grant);
      return acc;
    }, []);
  }

  public resourceOwners(): Set<string> {
    return new Set(this.dataOwners.map((dataOwner) => dataOwner.iri));
  }

  public resourceServers(resourceOwner: string, shapeTree: string): Set<string> {
    const dataOwner = this.dataOwners.find((owner) => owner.iri === resourceOwner);
    const grants = dataOwner.issuedGrants.filter((grant) => grant.registeredShapeTree === shapeTree);
    return new Set(grants.map((grant) => grant.storageIri));
  }

  private findGrant(storage: string, shapeTree: string): DataGrant {
    return this.dataOwners
      .flatMap((owner) => owner.issuedGrants)
      .find((dataGrant) => dataGrant.storageIri === storage && dataGrant.registeredShapeTree === shapeTree);
  }

  public async resources(resourceServer: string, shapeTree: string): Promise<Set<string>> {
    const grant = this.findGrant(resourceServer, shapeTree);
    let list: string[] = [];
    if (grant instanceof InheritedDataGrant) {
      throw new Error(`Cannot list instances from Inherited grants`);
    }
    if (grant instanceof SelectedFromRegistryDataGrant) {
      list = grant.hasDataInstance;
    }
    if (grant instanceof AllFromRegistryDataGrant) {
      const dataRegistration = await grant.factory.readable.dataRegistration(grant.hasDataRegistration);
      list = dataRegistration.contains;
    }
    for (const resource of list) {
      this.parentMap.set(resource, {
        id: resource,
        scope: shapeTree,
        resourceServer
      });
    }
    return new Set(list);
  }

  public childInfo(childId: string, scope: string, parentId: string): ChildInfo {
    const parentInfo = this.parentMap.get(parentId);
    return {
      id: childId,
      scope,
      resourceServer: parentInfo.resourceServer,
      parent: parentInfo.id
    };
  }

  public setChildInfo(childId: string, scope: string, parentId: string): void {
    this.childMap.set(childId, this.childInfo(childId, scope, parentId));
  }

  private getInfo(id: string): ParentInfo | ChildInfo {
    return (this.parentMap.get(id) || this.childMap.get(id))!;
  }

  public canCreate(resourceServer: string, scope: string): boolean {
    const grant = this.findGrant(resourceServer, scope);
    return grant.accessMode.includes(ACL.Create.value);
  }

  public canCreateChild(parentId: string, scope?: string): boolean {
    const info = this.getInfo(parentId);
    const grant = this.findGrant(info.resourceServer, scope || info.scope);
    return grant.accessMode.includes(ACL.Create.value);
  }

  public canUpdate(id: string, scope?: string): boolean {
    const info = this.getInfo(id);
    const grant = this.findGrant(info.resourceServer, scope || info.scope);
    return grant.accessMode.includes(ACL.Update.value);
  }

  public canDelete(id: string, scope?: string): boolean {
    const info = this.getInfo(id);
    const grant = this.findGrant(info.resourceServer, scope || info.scope);
    return grant.accessMode.includes(ACL.Delete.value);
  }

  public iriForNew(resourceServer: string, scope: string): string {
    const grant = this.findGrant(resourceServer, scope);
    return grant.iriForNew();
  }

  public iriForChild(parentId: string, scope: string): string {
    const { resourceServer } = this.parentMap.get(parentId);
    const iri = this.iriForNew(resourceServer, scope);
    this.childMap.set(iri, this.childInfo(iri, scope, parentId));
    return iri;
  }

  public findParent(childId: string): string {
    return this.childMap.get(childId).parent;
  }

  public async discoverDescription(resourceIri: string): Promise<string | undefined> {
    return discoverDescriptionResource(resourceIri, this.rawFetch);
  }
}
