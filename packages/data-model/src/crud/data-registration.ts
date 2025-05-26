import { INTEROP, RDF } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { CRUDContainer } from '.'
import type { AuthorizationAgentFactory } from '..'

export type DataRegistrationData = {
  registeredShapeTree: string
}

export class CRUDDataRegistration extends CRUDContainer {
  data: DataRegistrationData

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    data?: DataRegistrationData
  ): Promise<CRUDDataRegistration> {
    const instance = new CRUDDataRegistration(iri, factory, data)
    await instance.bootstrap()
    return instance
  }

  private datasetFromData(): void {
    const props: (keyof DataRegistrationData)[] = ['registeredShapeTree']
    for (const prop of props) {
      this.dataset.add(
        DataFactory.quad(
          DataFactory.namedNode(this.iri),
          INTEROP[prop],
          DataFactory.namedNode(this.data[prop])
        )
      )
    }
  }

  protected async bootstrap(): Promise<void> {
    if (!this.data) {
      await this.fetchData()
    } else {
      this.dataset.add(DataFactory.quad(this.node, RDF.type, INTEROP.DataRegistration))
      this.datasetFromData()
    }
  }
}
