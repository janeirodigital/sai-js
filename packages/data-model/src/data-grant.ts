import { DatasetCore, NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { Model, DataInstance, InteropFactory, DataGrant } from '.';

export abstract class AbstractDataGrant extends Model {
  dataset: DatasetCore;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory);
    this.dataset = dataset;
  }

  abstract getDataInstanceIterator(): AsyncIterable<DataInstance>;

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
   * @returns new DataInstance with IRI based on prefix from DataRegistration
   */
  public static newDataInstance(sourceGrant: DataGrant, parent?: DataInstance): DataInstance {
    const iri = `${sourceGrant.iriPrefix}${sourceGrant.factory.randomUUID()}`;
    const instance = new DataInstance(iri, sourceGrant.factory);
    instance.dataGrant = sourceGrant;
    instance.draft = true;
    if (parent) {
      instance.parent = parent;
    }
    return instance;
  }

  public static iriPrefix(sourceGrant: DataGrant): string {
    const dataRegistrationPattern = [DataFactory.namedNode(sourceGrant.iri), INTEROP.hasDataRegistration, null, null];
    const dataRegistrationNode = getOneMatchingQuad(sourceGrant.dataset, ...dataRegistrationPattern)
      .object as NamedNode;
    const iriPrefixPattern = [dataRegistrationNode, INTEROP.iriPrefix, null, null];
    return getOneMatchingQuad(sourceGrant.dataset, ...iriPrefixPattern).object.value;
  }
}
