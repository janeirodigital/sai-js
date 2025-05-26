import { INTEROP, RDF, XSD } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { ImmutableResource } from '.'
import type {
  AuthorizationAgentFactory,
  ImmutableDataAuthorization,
  ReadableAccessAuthorization,
} from '..'

type StringData = {
  grantedBy: string
  grantedWith: string
  grantee: string
  hasAccessNeedGroup?: string
}

export type AccessAuthorizationData = StringData & {
  dataAuthorizations: ImmutableDataAuthorization[]
  dataAuthorizationsToReuse?: string[]
  granted: boolean
}

export class ImmutableAccessAuthorization extends ImmutableResource {
  dataAuthorizations: ImmutableDataAuthorization[]

  data: AccessAuthorizationData

  factory: AuthorizationAgentFactory

  public constructor(
    iri: string,
    factory: AuthorizationAgentFactory,
    data: AccessAuthorizationData
  ) {
    super(iri, factory, data)
    this.dataAuthorizations = data.dataAuthorizations
    this.dataset.add(DataFactory.quad(this.node, RDF.type, INTEROP.AccessAuthorization))
    const props: (keyof StringData)[] = [
      'grantedBy',
      'grantedWith',
      'grantee',
      'hasAccessNeedGroup',
    ]
    for (const prop of props) {
      if (data[prop]) {
        this.dataset.add(
          DataFactory.quad(this.node, INTEROP[prop], DataFactory.namedNode(data[prop]))
        )
      }
    }
    for (const dataAuthorization of data.dataAuthorizations) {
      this.dataset.add(
        DataFactory.quad(
          this.node,
          INTEROP.hasDataAuthorization,
          DataFactory.namedNode(dataAuthorization.iri)
        )
      )
    }
    if (data.dataAuthorizationsToReuse) {
      for (const dataAuthorizationToReuse of data.dataAuthorizationsToReuse) {
        this.dataset.add(
          DataFactory.quad(
            this.node,
            INTEROP.hasDataAuthorization,
            DataFactory.namedNode(dataAuthorizationToReuse)
          )
        )
      }
    }
    this.dataset.add(
      DataFactory.quad(
        this.node,
        INTEROP.grantedAt,
        DataFactory.literal(new Date().toISOString(), XSD.dateTime)
      )
    )
    this.dataset.add(
      DataFactory.quad(
        this.node,
        INTEROP.granted,
        DataFactory.literal(data.granted.toString(), XSD.boolean)
      )
    )
  }

  public async store(): Promise<ReadableAccessAuthorization> {
    // store all data grants first
    // TODO: take into account retrying - if given grant already exists just move on
    await Promise.all(this.dataAuthorizations.map((grant) => grant.put()))
    await this.put()
    return this.factory.readable.accessAuthorization(this.iri)
  }
}
