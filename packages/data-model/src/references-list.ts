import { NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getOneMatchingQuad, getAllMatchingQuads } from 'interop-utils';
import { Model, InteropFactory } from '.';

export class ReferencesList extends Model {
  private async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReferencesList> {
    const instance = new ReferencesList(iri, factory);
    await instance.bootstrap();
    return instance;
  }

  @Memoize()
  get referencePredicate(): NamedNode {
    // TODO (elf-pavlik) use getObject once stable namespace
    const quadPattern = [
      DataFactory.namedNode(this.iri),
      DataFactory.namedNode('https://tbd.example/referencePredicate'),
      null,
      null
    ];
    return getOneMatchingQuad(this.dataset, ...quadPattern).object as NamedNode;
  }

  @Memoize()
  get referencesOf(): NamedNode {
    // TODO (elf-pavlik) use getObject once stable namespace
    const quadPattern = [
      DataFactory.namedNode(this.iri),
      DataFactory.namedNode('https://tbd.example/referencesOf'),
      null,
      null
    ];
    return getOneMatchingQuad(this.dataset, ...quadPattern).object as NamedNode;
  }

  @Memoize()
  get references(): string[] {
    const quadPattern = [this.referencesOf, this.referencePredicate, null, null];
    return getAllMatchingQuads(this.dataset, ...quadPattern).map((quad) => quad.object.value);
  }
}
