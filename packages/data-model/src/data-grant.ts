import { DatasetCore, NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getOneMatchingQuad } from 'interop-utils';
import { ACL, INTEROP } from 'interop-namespaces';
import { Model, DataInstance, InteropFactory, DataGrant } from '.';
import { RemoteDataGrant } from './data-grants';

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

  // TODO (elf-pavlik) see if it will need reference to source data grant
  /*
   * @remarks
   * This method returns Data Instance with no dataset, it should be
   * used with `DataInstance#update` to add datset and store it on the server
   *
   * @returns new DataInstance with IRI based on prefix from DataRegistration
   */
  public static newDataInstance(sourceGrant: DataGrant): DataInstance {
    const iri = `${sourceGrant.iriPrefix}${sourceGrant.factory.randomUUID()}`;
    return new DataInstance(iri, sourceGrant.factory);
  }

  // TODO (elf-pavlik) make snippets
  public static iriPrefix(sourceGrant: DataGrant): string {
    const dataRegistrationPattern = [
      DataFactory.namedNode(sourceGrant.iri),
      DataFactory.namedNode(INTEROP.hasDataRegistration),
      null,
      null
    ];
    const dataRegistrationNode = getOneMatchingQuad(sourceGrant.dataset, ...dataRegistrationPattern)
      .object as NamedNode;
    const iriPrefixPattern = [dataRegistrationNode, DataFactory.namedNode(INTEROP.iriPrefix), null, null];
    return getOneMatchingQuad(sourceGrant.dataset, ...iriPrefixPattern).object.value;
  }

  public static createDataInstanceIterotorInRemote(remoteDataGrant: RemoteDataGrant): AsyncIterable<DataInstance> {
    return {
      async *[Symbol.asyncIterator]() {
        for (const sourceDataGrant of remoteDataGrant.hasSourceGrant) {
          yield* sourceDataGrant.getDataInstanceIterator();
        }
      }
    };
  }

  // TODO (elf-pavlik) generalize
  public static calculateEffectiveAccessMode(dataGrant: DataGrant): string[] {
    const mode = [ACL.Read.value];

    // defaults to the data grant itself
    let canWrite = dataGrant.accessMode.includes(ACL.Write.value);

    // if viaRemoteDataGrant exists take it into account
    if (dataGrant.viaRemoteDataGrant) {
      canWrite = canWrite && dataGrant.viaRemoteDataGrant.accessMode.includes(ACL.Write.value);
    }

    if (canWrite) {
      mode.push(ACL.Write.value);
    }
    return mode;
  }
}
