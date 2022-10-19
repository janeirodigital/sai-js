import { Memoize } from 'typescript-memoize';
import { DataFactory } from 'n3';
import { NamedNode } from '@rdfjs/types';
import { SHAPETREES, XSD } from '@janeirodigital/interop-namespaces';
import { InteropFactory } from '..';
import { ReadableResource, ReadableShapeTreeDescription } from '.';

export class ReadableShapeTree extends ReadableResource {
  shapeText: string;

  public descriptions: { [key: string]: ReadableShapeTreeDescription } = {};

  constructor(public iri: string, public factory: InteropFactory, public descriptionLang?: string) {
    super(iri, factory);
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    this.shapeText = await (await this.fetch(this.shape, { headers: { Accept: 'text/shex' } })).text();
    if (this.descriptionLang) {
      const description = await this.getDescription(this.descriptionLang);
      if (description) {
        this.descriptions[this.descriptionLang] = description;
      }
    }
  }

  public static async build(
    iri: string,
    factory: InteropFactory,
    descriptionLang?: string
  ): Promise<ReadableShapeTree> {
    const instance = new ReadableShapeTree(iri, factory, descriptionLang);
    await instance.bootstrap();
    return instance;
  }

  private async getDescription(lang: string): Promise<ReadableShapeTreeDescription | null> {
    const descriptionSetNode = this.getQuad(
      null,
      SHAPETREES.usesLanguage,
      DataFactory.literal(lang, XSD.language)
    ).subject;
    if (!descriptionSetNode) return null;
    const descriptionNodes = this.getSubjectsArray(SHAPETREES.describes);
    // get description from the set for the language (in specific description set)
    const descriptionIri = descriptionNodes
      .filter((node) => this.dataset.match(node, SHAPETREES.inDescriptionSet, descriptionSetNode))
      .shift()?.value;
    return descriptionIri ? ReadableShapeTreeDescription.build(descriptionIri, this.factory) : null;
  }

  getPredicateForReferenced(shapeTree: string): NamedNode {
    const referencedNode = this.getQuad(null, SHAPETREES.hasShapeTree, DataFactory.namedNode(shapeTree)).subject;
    return this.getQuad(referencedNode, SHAPETREES.viaPredicate).object as NamedNode;
  }

  @Memoize()
  get shape(): string {
    return this.getObject('shape', SHAPETREES).value;
  }
}
