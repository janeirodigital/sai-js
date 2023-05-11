import { DatasetCore, NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { DataInstance, InteropFactory, DataGrant } from '..';
import { ReadableResource } from '.';

export abstract class AbstractDataGrant extends ReadableResource {
  dataset: DatasetCore;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory);
    this.dataset = dataset;
  }

  abstract getDataInstanceIterator(): AsyncIterable<DataInstance>;

  @Memoize()
  get dataOwner(): string {
    return this.getObject('dataOwner').value;
  }

  @Memoize()
  get scopeOfGrant(): NamedNode {
    return this.getObject('scopeOfGrant');
  }

  @Memoize()
  get accessMode(): string[] {
    return this.getObjectsArray('accessMode').map((object) => object.value);
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  @Memoize()
  get hasDataRegistration(): string {
    return this.getObject('hasDataRegistration').value;
  }

  /*
   * @remarks
   * This method returns Data Instance with no dataset, it should be
   * used with `DataInstance#update` to add datset and store it on the server
   *
   * @returns new DataInstance with IRI based on prefix from ReadableDataRegistration
   */
  public static async newDataInstance(sourceGrant: DataGrant, parent?: DataInstance): Promise<DataInstance> {
    // TODO find a way to replace with Container#iri
    const iri = `${sourceGrant.hasDataRegistration}${sourceGrant.factory.randomUUID()}`;
    return DataInstance.build(iri, sourceGrant, sourceGrant.factory, parent, true);
  }

  @Memoize()
  get iriPrefix(): string {
    const dataRegistrationPattern = [DataFactory.namedNode(this.iri), INTEROP.hasDataRegistration];
    const dataRegistrationNode = this.getQuad(...dataRegistrationPattern).object as NamedNode;
    const iriPrefixPattern = [dataRegistrationNode, INTEROP.iriPrefix];
    return this.getQuad(...iriPrefixPattern).object.value;
  }
}
