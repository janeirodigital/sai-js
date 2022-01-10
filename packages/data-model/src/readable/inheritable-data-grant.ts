import { INTEROP } from '@janeirodigital/interop-namespaces';
import { DatasetCore } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { AbstractDataGrant, AllInstancesDataGrant, InheritInstancesDataGrant, SelectedInstancesDataGrant } from '.';
import { InteropFactory } from '..';

export abstract class InheritableDataGrant extends AbstractDataGrant {
  hasInheritingGrant: Set<InheritInstancesDataGrant>;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory, dataset);
    this.hasInheritingGrant = new Set();
  }

  protected async bootstrap(): Promise<void> {
    for (const inheritingGrantIri of this.hasInheritingGrantIriList) {
      // eslint-disable-next-line no-await-in-loop
      const inheritingGrant = (await this.factory.readable.dataGrant(inheritingGrantIri)) as InheritInstancesDataGrant;
      inheritingGrant.inheritsFromGrant = this as unknown as AllInstancesDataGrant | SelectedInstancesDataGrant;
      this.hasInheritingGrant.add(inheritingGrant);
    }
  }

  @Memoize()
  get hasInheritingGrantIriList(): string[] {
    return this.getSubjectsArray(INTEROP.inheritsFromGrant).map((subject) => subject.value);
  }
}
