import { DatasetCore, NamedNode } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { INTEROP } from 'interop-namespaces';
import { Model, DataInstance, ChildAccessMode, InteropFactory } from '.';

export interface DataInstanceIteratorOptions {
  accessMode?: NamedNode[];
  childAccessMode?: ChildAccessMode;
}

export abstract class DataGrant extends Model {
  dataset: DatasetCore;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory);
    this.dataset = dataset;
  }

  abstract getDataInstanceIterator(options?: DataInstanceIteratorOptions): AsyncIterable<DataInstance>;

  @Memoize()
  get scopeOfGrant(): NamedNode {
    return this.getObject('scopeOfGrant');
  }

  @Memoize()
  get accessMode(): NamedNode[] {
    return this.getObjectsArray('accessMode');
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  static getLowestCommonAccessMode(remoteMode: NamedNode[], localMode: NamedNode[]): NamedNode[] {
    // TODO (elf-pavlik) generalize
    const mode = [INTEROP.Read];
    if (remoteMode.includes(INTEROP.Write) && localMode.includes(INTEROP.Write)) {
      mode.push(INTEROP.Write);
    }
    return mode;
  }
}
