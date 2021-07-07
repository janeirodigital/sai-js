import { DatasetCore, NamedNode } from '@rdfjs/types';
import { Memoize } from 'typescript-memoize';
import { Model, DataInstance, InteropFactory } from '.';

export abstract class DataGrant extends Model {
  inheritsFromGrant?: DataGrant;

  dataset: DatasetCore;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory);
    this.dataset = dataset;
  }

  abstract getDataInstanceIterator(): AsyncIterable<DataInstance>;

  // TODO (elf-pavlik) rethink Access Receipt tests and possibly remove
  get inheritsFromGrantIri(): string | undefined {
    return this.getObject('inheritsFromGrant')?.value;
  }

  @Memoize()
  get scopeOfGrant(): NamedNode {
    return this.getObject('scopeOfGrant');
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }
}
