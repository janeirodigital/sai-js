import { INTEROP } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgentFactory } from '../authorization-agent-factory';
import { ReadableAccessDescriptionSet } from './access-description-set';
import { ReadableAccessNeedDescription } from './access-need-description';
import { ReadableResource } from './resource';
import { ReadableShapeTree } from './shape-tree';

export class ReadableAccessNeed extends ReadableResource {
  shapeTree: ReadableShapeTree;

  children: ReadableAccessNeed[] = [];

  public descriptions: { [key: string]: ReadableAccessNeedDescription } = {};

  constructor(public iri: string, public factory: AuthorizationAgentFactory, public descriptionLang?: string) {
    super(iri, factory);
  }

  get registeredShapeTree(): string {
    return this.getObject(INTEROP.registeredShapeTree)!.value;
  }

  get inheritsFromNeed(): string | undefined {
    return this.getObject(INTEROP.inheritsFromNeed)?.value;
  }

  get hasInheritingNeed(): string[] {
    return this.getSubjectsArray(INTEROP.inheritsFromNeed).map((subject) => subject.value);
  }

  get accessMode(): string[] {
    return this.getObjectsArray(INTEROP.accessMode).map((object) => object.value);
  }

  // TODO ensure if it is required
  get required(): boolean {
    return this.getObject(INTEROP.accessNecessity)?.value === INTEROP.AccessRequired.value;
  }

  private async getDescription(descriptionLang: string): Promise<ReadableAccessNeedDescription | undefined> {
    const descriptionSetIri = ReadableAccessDescriptionSet.findInLanguage(this, descriptionLang);
    if (!descriptionSetIri) return undefined;
    const descriptionSet = await this.factory.readable.accessDescriptionSet(descriptionSetIri);
    return descriptionSet.accessNeedDescriptions.find((description) => description.hasAccessNeed === this.iri);
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData();
    this.shapeTree = await this.factory.readable.shapeTree(this.registeredShapeTree, this.descriptionLang);
    if (this.hasInheritingNeed.length) {
      this.children = await Promise.all(
        this.hasInheritingNeed.map((iri) => this.factory.readable.accessNeed(iri, this.descriptionLang))
      );
    }
    if (this.descriptionLang) {
      const description = await this.getDescription(this.descriptionLang);
      if (description) {
        this.descriptions[this.descriptionLang] = description;
      }
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    descriptionLang?: string
  ): Promise<ReadableAccessNeed> {
    const instance = new ReadableAccessNeed(iri, factory, descriptionLang);
    await instance.bootstrap();
    return instance;
  }
}
