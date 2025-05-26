import { INTEROP } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { Mixin } from 'ts-mixer'
import type { AuthorizationAgentFactory, ReadableAccessGrant } from '..'
import { AgentRegistrationGetters } from '../mixins/agent-registration-getters'
import { CRUDContainer } from './container'

export type AgentRegistrationData = {
  registeredAgent: string
  hasAccessGrant?: string
}

export abstract class CRUDAgentRegistration extends Mixin(CRUDContainer, AgentRegistrationGetters) {
  data?: AgentRegistrationData

  factory: AuthorizationAgentFactory

  accessGrant?: ReadableAccessGrant

  // TODO: change to avoid stale access grant
  protected async buildAccessGrant(): Promise<void> {
    if (this.hasAccessGrant) {
      this.accessGrant = await this.factory.readable.accessGrant(this.hasAccessGrant)
    }
  }

  async setAccessGrant(accessGrantIri: string): Promise<void> {
    const quad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      INTEROP.hasAccessGrant,
      DataFactory.namedNode(accessGrantIri)
    )
    // unlink prevoius access grant if exists
    if (this.hasAccessGrant) {
      const priorQuad = this.getQuad(
        DataFactory.namedNode(this.iri),
        INTEROP.hasAccessGrant,
        DataFactory.namedNode(this.hasAccessGrant)
      )
      await this.replaceStatement(priorQuad, quad)
    } else {
      await this.addStatement(quad)
    }
  }

  get hasAccessGrant(): string | undefined {
    return this.getObject('hasAccessGrant')?.value
  }

  protected datasetFromData(): void {
    const props: (keyof AgentRegistrationData)[] = ['registeredAgent', 'hasAccessGrant']
    for (const prop of props) {
      if (this.data[prop]) {
        this.dataset.add(
          DataFactory.quad(
            DataFactory.namedNode(this.iri),
            INTEROP[prop],
            DataFactory.namedNode(this.data[prop])
          )
        )
      }
    }
  }
}
