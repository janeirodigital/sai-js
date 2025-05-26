import { INTEROP, SKOS } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { CRUDResource } from '.'
import type { AuthorizationAgentFactory } from '..'

export type SocialAgentInvitationData = {
  capabilityUrl: string
  prefLabel: string
  note?: string
}

export class CRUDSocialAgentInvitation extends CRUDResource {
  data?: SocialAgentInvitationData

  // TODO: handle missing labels
  get label(): string {
    return this.getObject(SKOS.prefLabel)!.value
  }

  get note(): string | undefined {
    return this.getObject(SKOS.note)?.value
  }

  get capabilityUrl(): string {
    return this.getObject(INTEROP.hasCapabilityUrl)!.value
  }

  get registeredAgent(): string | undefined {
    return this.getObject(INTEROP.registeredAgent)?.value
  }

  set registeredAgent(webId: string) {
    this.deleteQuad('registeredAgent')
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.registeredAgent,
        DataFactory.namedNode(webId)
      )
    )
  }

  protected datasetFromData(): void {
    this.dataset.add(
      DataFactory.quad(
        DataFactory.namedNode(this.iri),
        INTEROP.hasCapabilityUrl,
        DataFactory.literal(this.data.capabilityUrl)
      )
    )
    const props: (keyof SocialAgentInvitationData)[] = ['prefLabel', 'note']
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
      this.datasetFromData()
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: SocialAgentInvitationData
  ): Promise<CRUDSocialAgentInvitation> {
    const instance = new CRUDSocialAgentInvitation(iri, factory, data)
    await instance.bootstrap()
    return instance
  }
}
