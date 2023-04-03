import { InteropFactory, ReadableDataRegistration } from '..';
import { ReadableResource } from './resource';

interface ChildInfo {
  shapeTree: {
    iri: string;
    label: string;
  };
  count: number;
}

export class ReadableDataInstance extends ReadableResource {
  dataRegistration: ReadableDataRegistration;
  children: ChildInfo[];

  constructor(public iri: string, public factory: InteropFactory, public descriptionLang?: string) {
    super(iri, factory);
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildDataRegistration();
    if (this.descriptionLang) {
      await this.dataRegistration?.shapeTree?.getDescription(this.descriptionLang);
      this.children = await this.buildChildrenInfo();
    }
  }

  private async buildDataRegistration() {
    const dataRegistrationIri = this.iri.split('/').slice(0, -1).join('/') + '/';
    this.dataRegistration = await this.factory.readable.dataRegistration(dataRegistrationIri);
  }

  public static async build(
    iri: string,
    factory: InteropFactory,
    descriptionLang?: string
  ): Promise<ReadableDataInstance> {
    const instance = new ReadableDataInstance(iri, factory, descriptionLang);
    await instance.bootstrap();
    return instance;
  }

  get label(): string | undefined {
    const predicate = this.dataRegistration?.shapeTree?.describesInstance;
    if (predicate) {
      return this.getObject(predicate).value;
    }
  }

  get shapeTree(): { iri: string; label: string } {
    return {
      iri: this.dataRegistration!.shapeTree!.iri,
      label: this.dataRegistration!.shapeTree!.descriptions[this.descriptionLang]!.label
    };
  }

  async buildChildrenInfo(): Promise<ChildInfo[]> {
    return Promise.all(
      this.dataRegistration!.shapeTree!.references.map(async (reference) => {
        const childTree = await this.factory.readable.shapeTree(reference.shapeTree, this.descriptionLang);
        return {
          count: this.getObjectsArray(reference.viaPredicate).length,
          shapeTree: {
            iri: reference.shapeTree,
            label: childTree.descriptions[this.descriptionLang]!.label
          }
        };
      })
    );
  }
}
