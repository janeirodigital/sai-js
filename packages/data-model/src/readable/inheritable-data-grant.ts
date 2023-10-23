import { INTEROP } from '@janeirodigital/interop-utils';
import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, AllFromRegistryDataGrant, InheritedDataGrant, SelectedFromRegistryDataGrant } from '.';
import { InteropFactory } from '..';

export abstract class InheritableDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritedDataGrant>;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset);
    this.hasInheritingGrant = new Set();
  }

  protected async bootstrap(): Promise<void> {
    for (const inheritingGrantIri of this.hasInheritingGrantIriList) {
      // eslint-disable-next-line no-await-in-loop
      const inheritingGrant = (await this.factory.readable.dataGrant(inheritingGrantIri)) as InheritedDataGrant;
      inheritingGrant.inheritsFromGrant = this as unknown as AllFromRegistryDataGrant | SelectedFromRegistryDataGrant;
      this.hasInheritingGrant.add(inheritingGrant);
    }
  }

  @Memoize()
  get hasInheritingGrantIriList(): string[] {
    return this.getSubjectsArray(INTEROP.inheritsFromGrant).map((subject) => subject.value);
  }

  // TODO: extract to a mixin
  get dataRegistryIri(): string {
    const dataRegistrationIri = this.getObject('hasDataRegistration').value;
    return `${dataRegistrationIri.split('/').slice(0, -2).join('/')}/`;
  }
}
