import { DatasetCore, NamedNode } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { ACL } from 'interop-namespaces';
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
