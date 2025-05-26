import {
  AllFromRegistryDataGrant,
  ApplicationFactory,
  type DataGrant,
  DataOwner,
  InheritedDataGrant,
  type ReadableApplicationRegistration,
  SelectedFromRegistryDataGrant,
} from '@janeirodigital/interop-data-model'
import {
  ACL,
  type RdfFetch,
  type WhatwgFetch,
  discoverAgentRegistration,
  discoverAuthorizationAgent,
  discoverAuthorizationRedirectEndpoint,
  discoverDescriptionResource,
  fetchWrapper,
} from '@janeirodigital/interop-utils'

interface ApplicationDependencies {
  fetch: WhatwgFetch
  randomUUID(): string
}

type ParentInfo = {
  id: string
  scope: string
  resourceServer: string
}

type ChildInfo = {
  id: string
  scope: string
  resourceServer: string
  parent: string
}

export class Application {
  factory: ApplicationFactory

  rawFetch: WhatwgFetch

  fetch: RdfFetch

  authorizationAgentIri: string

  authorizationRedirectEndpoint: string

  registrationIri: string

  // TODO rename
  hasApplicationRegistration?: ReadableApplicationRegistration

  public parentMap: Map<string, ParentInfo> = new Map()

  public childMap: Map<string, ChildInfo> = new Map()

  constructor(
    public webId: string,
    public applicationId: string,
    dependencies: ApplicationDependencies
  ) {
    this.rawFetch = dependencies.fetch
    this.fetch = fetchWrapper(this.rawFetch)
    this.factory = new ApplicationFactory({
      fetch: this.fetch,
      randomUUID: dependencies.randomUUID,
    })
  }

  private async bootstrap(): Promise<void> {
    this.authorizationAgentIri = await discoverAuthorizationAgent(this.webId, this.fetch)
    this.registrationIri = await discoverAgentRegistration(
      this.authorizationAgentIri,
      this.rawFetch
    )
    this.authorizationRedirectEndpoint = await discoverAuthorizationRedirectEndpoint(
      this.authorizationAgentIri,
      this.rawFetch
    )
    if (!this.registrationIri) return
    await this.buildRegistration()
  }

  public async buildRegistration(): Promise<void> {
    if (this.registrationIri) {
      this.hasApplicationRegistration = await this.factory.readable.applicationRegistration(
        this.registrationIri
      )
    }
  }

  get authorizationRedirectUri(): string {
    return `${this.authorizationRedirectEndpoint}?client_id=${encodeURIComponent(this.applicationId)}`
  }

  getShareUri(resourceIri: string): string {
    return `${this.authorizationRedirectEndpoint}?resource=${encodeURIComponent(
      resourceIri
    )}&client_id=${encodeURIComponent(this.applicationId)}`
  }

  static async build(
    webId: string,
    applicationId: string,
    dependencies: ApplicationDependencies
  ): Promise<Application> {
    const application = new Application(webId, applicationId, dependencies)
    await application.bootstrap()
    return application
  }

  /**
   * Array of DataOwner instances out of all the data application can access.
   * @public
   */
  get dataOwners(): DataOwner[] {
    if (!this.hasApplicationRegistration) return []
    return this.hasApplicationRegistration.hasAccessGrant.hasDataGrant.reduce((acc, grant) => {
      let owner: DataOwner = acc.find((agent) => agent.iri === grant.dataOwner)
      if (!owner) {
        owner = new DataOwner(grant.dataOwner)
        acc.push(owner)
      }
      owner.issuedGrants.push(grant)
      return acc
    }, [])
  }

  public resourceOwners(): Set<string> {
    return new Set(this.dataOwners.map((dataOwner) => dataOwner.iri))
  }

  public resourceServers(resourceOwner: string, scope: string): Set<string> {
    const dataOwner = this.dataOwners.find((owner) => owner.iri === resourceOwner)
    const grants = dataOwner.issuedGrants.filter((grant) => grant.registeredShapeTree === scope)
    return new Set(grants.map((grant) => grant.storageIri))
  }

  private findGrant(storage: string, scope: string): DataGrant {
    return this.dataOwners
      .flatMap((owner) => owner.issuedGrants)
      .find(
        (dataGrant) => dataGrant.storageIri === storage && dataGrant.registeredShapeTree === scope
      )
  }

  public async resources(resourceServer: string, scope: string): Promise<Set<string>> {
    const grant = this.findGrant(resourceServer, scope)
    let list: string[] = []
    if (grant instanceof InheritedDataGrant) {
      throw new Error('Cannot list instances from Inherited grants')
    }
    if (grant instanceof SelectedFromRegistryDataGrant) {
      list = grant.hasDataInstance
    }
    if (grant instanceof AllFromRegistryDataGrant) {
      const dataRegistration = await grant.factory.readable.dataRegistration(
        grant.hasDataRegistration
      )
      list = dataRegistration.contains
    }
    for (const resource of list) {
      this.parentMap.set(resource, {
        id: resource,
        scope: scope,
        resourceServer,
      })
    }
    return new Set(list)
  }

  public childInfo(childId: string, scope: string, parentId: string): ChildInfo {
    const parentInfo = this.parentMap.get(parentId)
    return {
      id: childId,
      scope,
      resourceServer: parentInfo.resourceServer,
      parent: parentInfo.id,
    }
  }

  public setChildInfo(childId: string, scope: string, parentId: string): void {
    this.childMap.set(childId, this.childInfo(childId, scope, parentId))
  }

  private getInfo(id: string): ParentInfo | ChildInfo {
    return (this.parentMap.get(id) || this.childMap.get(id))!
  }

  public canCreate(resourceServer: string, scope: string): boolean {
    const grant = this.findGrant(resourceServer, scope)
    return grant?.accessMode.includes(ACL.Create.value)
  }

  public canCreateChild(parentId: string, scope: string): boolean {
    const { resourceServer } = this.parentMap.get(parentId)
    const grant = this.findGrant(resourceServer, scope)
    return grant?.accessMode.includes(ACL.Create.value)
  }

  public canUpdate(id: string): boolean {
    const info = this.getInfo(id)
    const grant = this.findGrant(info.resourceServer, info.scope)
    return grant?.accessMode.includes(ACL.Update.value)
  }

  public canDelete(id: string): boolean {
    const info = this.getInfo(id)
    const grant = this.findGrant(info.resourceServer, info.scope)
    return grant?.accessMode.includes(ACL.Delete.value)
  }

  // TODO: rename to idForNew
  public iriForNew(resourceServer: string, scope: string): string {
    const grant = this.findGrant(resourceServer, scope)
    return grant.iriForNew()
  }

  public iriForChild(parentId: string, scope: string): string {
    const { resourceServer } = this.parentMap.get(parentId)
    const iri = this.iriForNew(resourceServer, scope)
    this.childMap.set(iri, this.childInfo(iri, scope, parentId))
    return iri
  }

  public findParent(childId: string): string {
    return this.childMap.get(childId).parent
  }

  public async discoverDescription(resourceIri: string): Promise<string | undefined> {
    return discoverDescriptionResource(resourceIri, this.rawFetch)
  }
}
