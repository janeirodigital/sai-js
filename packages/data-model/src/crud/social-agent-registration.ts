import {
  INTEROP,
  RDF,
  SKOS,
  type WhatwgFetch,
  discoverAgentRegistration,
  discoverAuthorizationAgent,
} from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { type AgentRegistrationData, CRUDAgentRegistration } from '.'
import type { AuthorizationAgentFactory } from '..'

type ClassData = {
  prefLabel: string
  note?: string
}

export type SocialAgentRegistrationData = AgentRegistrationData & ClassData

export class CRUDSocialAgentRegistration extends CRUDAgentRegistration {
  data?: SocialAgentRegistrationData

  reciprocalRegistration?: CRUDSocialAgentRegistration

  reciprocal: boolean

  public constructor(
    iri: string,
    factory: AuthorizationAgentFactory,
    reciprocal: boolean,
    data?: SocialAgentRegistrationData
  ) {
    super(iri, factory, data)
    this.reciprocal = reciprocal
  }

  // TODO: handle missing labels
  get label(): string {
    return this.getObject(SKOS.prefLabel)!.value
  }

  get note(): string | undefined {
    return this.getObject(SKOS.note)?.value
  }

  get hasAccessNeedGroup(): string | undefined {
    return this.getObject(INTEROP.hasAccessNeedGroup)?.value
  }

  // TODO: (elf-pavlik) recover if reciprocal can't be fetched
  private async buildReciprocalRegistration(): Promise<void> {
    const reciprocalRegistrationIri = this.getObject(INTEROP.reciprocalRegistration)?.value
    if (reciprocalRegistrationIri) {
      this.reciprocalRegistration = await this.factory.crud.socialAgentRegistration(
        reciprocalRegistrationIri,
        true
      )
    }
  }

  // TODO: adjust factory to also expose WhatwgFetch
  public async discoverReciprocal(fetch: WhatwgFetch): Promise<string | null> {
    const authrizationAgentIri = await discoverAuthorizationAgent(
      this.registeredAgent,
      this.factory.fetch
    )
    if (!authrizationAgentIri) return null
    return discoverAgentRegistration(authrizationAgentIri, fetch)
  }

  private async updateReciprocal(reciprocalRegistrationIri: string): Promise<void> {
    const quad = DataFactory.quad(
      this.node,
      INTEROP.reciprocalRegistration,
      DataFactory.namedNode(reciprocalRegistrationIri)
    )
    if (this.reciprocalRegistration) {
      const priorQuad = this.getQuad(this.node, INTEROP.reciprocalRegistration)
      await this.replaceStatement(priorQuad, quad)
    } else {
      await this.addStatement(quad)
    }
    await this.buildReciprocalRegistration()
  }

  public async discoverAndUpdateReciprocal(fetch: WhatwgFetch): Promise<void> {
    const reciprocalRegistrationIri = await this.discoverReciprocal(fetch)
    if (reciprocalRegistrationIri) {
      await this.updateReciprocal(reciprocalRegistrationIri)
    }
  }

  public async setAccessNeedGroup(accessNeedGroupIri: string): Promise<void> {
    const quad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      INTEROP.hasAccessNeedGroup,
      DataFactory.namedNode(accessNeedGroupIri)
    )
    // unlink prevoius access grant if exists
    if (this.hasAccessNeedGroup) {
      const priorQuad = this.getQuad(
        DataFactory.namedNode(this.iri),
        INTEROP.hasAccessNeedGroup,
        DataFactory.namedNode(this.hasAccessNeedGroup)
      )
      await this.replaceStatement(priorQuad, quad)
    } else {
      await this.addStatement(quad)
    }
  }

  protected datasetFromData(): void {
    super.datasetFromData()
    const props: (keyof ClassData)[] = ['prefLabel', 'note']
    for (const prop of props) {
      if (this.data[prop]) {
        this.dataset.add(
          DataFactory.quad(
            DataFactory.namedNode(this.iri),
            SKOS[prop],
            DataFactory.literal(this.data[prop])
          )
        )
      }
    }
  }

  protected async bootstrap(): Promise<void> {
    if (!this.data) {
      await this.fetchData()
    } else {
      this.dataset.add(DataFactory.quad(this.node, RDF.type, INTEROP.SocialAgentRegistration))
      this.datasetFromData()
    }
    await this.buildAccessGrant()
    if (!this.reciprocal) {
      await this.buildReciprocalRegistration()
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    reciprocal: boolean,
    data?: SocialAgentRegistrationData
  ): Promise<CRUDSocialAgentRegistration> {
    const instance = new CRUDSocialAgentRegistration(iri, factory, reciprocal, data)
    await instance.bootstrap()
    return instance
  }
}
