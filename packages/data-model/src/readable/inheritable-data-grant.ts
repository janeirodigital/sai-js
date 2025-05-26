import { INTEROP } from '@janeirodigital/interop-utils'
import type { DatasetCore } from '@rdfjs/types'
import { Memoize } from 'typescript-memoize'
import {
  AbstractDataGrant,
  type AllFromRegistryDataGrant,
  type InheritedDataGrant,
  type SelectedFromRegistryDataGrant,
} from '.'
import type { InteropFactory } from '..'

export abstract class InheritableDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritedDataGrant>

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset)
    this.hasInheritingGrant = new Set()
  }

  protected async bootstrap(): Promise<void> {
    for (const inheritingGrantIri of this.hasInheritingGrantIriList) {
      const inheritingGrant = (await this.factory.readable.dataGrant(
        inheritingGrantIri
      )) as InheritedDataGrant
      inheritingGrant.inheritsFromGrant = this as unknown as
        | AllFromRegistryDataGrant
        | SelectedFromRegistryDataGrant
      this.hasInheritingGrant.add(inheritingGrant)
    }
  }

  @Memoize()
  get hasInheritingGrantIriList(): string[] {
    return this.getSubjectsArray(INTEROP.inheritsFromGrant).map((subject) => subject.value)
  }

  // TODO: extract to a mixin
  // TODO: change not to rely on /
  get dataRegistryIri(): string {
    const dataRegistrationIri = this.getObject('hasDataRegistration').value
    return `${dataRegistrationIri.split('/').slice(0, -2).join('/')}/`
  }

  // TODO: extract to a mixin
  // TODO: change not to rely on /
  // TODO: get from storage description like in CRUDDataRegistry
  get storageIri(): string {
    const dataRegistrationIri = this.getObject('hasDataRegistration').value
    return `${dataRegistrationIri.split('/').slice(0, -3).join('/')}/`
  }
}
