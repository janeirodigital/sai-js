import { INTEROP, RDF } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { CRUDContainer } from '.'
import type { AuthorizationAgentFactory, ReadableAccessAuthorization } from '..'
import type { CRUDData } from './resource'

export class CRUDAuthorizationRegistry extends CRUDContainer {
  factory: AuthorizationAgentFactory

  async bootstrap(): Promise<void> {
    await this.fetchData()
    if (this.data) {
      this.dataset.add(DataFactory.quad(this.node, RDF.type, INTEROP.AuthorizationRegistry))
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: CRUDData
  ): Promise<CRUDAuthorizationRegistry> {
    const instance = new CRUDAuthorizationRegistry(iri, factory, data)
    await instance.bootstrap()
    return instance
  }

  get accessAuthorizations(): AsyncIterable<ReadableAccessAuthorization> {
    const accessAuthorizationPattern = [
      DataFactory.namedNode(this.iri),
      INTEROP.hasAccessAuthorization,
    ]
    const accessAuthorizationIris = this.getQuadArray(...accessAuthorizationPattern).map(
      (q) => q.object.value
    )
    const { factory } = this
    return {
      async *[Symbol.asyncIterator]() {
        for (const iri of accessAuthorizationIris) {
          yield factory.readable.accessAuthorization(iri)
        }
      },
    }
  }

  async findAuthorization(agentIri: string): Promise<ReadableAccessAuthorization | undefined> {
    for await (const authorization of this.accessAuthorizations) {
      if (authorization.grantee === agentIri) {
        return authorization
      }
    }
  }

  /*
   * Links access authorization from registry
   * If prior authorization exists for that agent it gets unlinked
   * Updates itself
   */
  async add(accessAuthorization: ReadableAccessAuthorization): Promise<void> {
    const quad = DataFactory.quad(
      DataFactory.namedNode(this.iri),
      INTEROP.hasAccessAuthorization,
      DataFactory.namedNode(accessAuthorization.iri)
    )
    // unlink prevoius access authorization for that grantee if exists
    const priorAuthorization = await this.findAuthorization(accessAuthorization.grantee)
    if (priorAuthorization) {
      const priorQuad = this.getQuad(
        DataFactory.namedNode(this.iri),
        INTEROP.hasAccessAuthorization,
        DataFactory.namedNode(priorAuthorization.iri)
      )
      await this.replaceStatement(priorQuad, quad)
    } else {
      await this.addStatement(quad)
    }
  }

  // match dataOwner on data authorizations - scope All will have no dataOwner but we want it to also match
  async findAuthorizationsDelegatingFromOwner(
    dataOwner: string
  ): Promise<ReadableAccessAuthorization[]> {
    const matching: ReadableAccessAuthorization[] = []
    for await (const accessAuthorization of this.accessAuthorizations) {
      let matches = false
      // exclude authorizations where dataOwner is also the grantee (it would match when All scope)
      if (accessAuthorization.grantee !== dataOwner) {
        for await (const dataAuthorization of accessAuthorization.dataAuthorizations) {
          if (!dataAuthorization.dataOwner || dataAuthorization.dataOwner === dataOwner) {
            matches = true
          }
        }
      }
      if (matches) {
        matching.push(accessAuthorization)
      }
    }
    return matching
  }
}
