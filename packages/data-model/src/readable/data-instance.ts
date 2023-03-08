import { InteropFactory, ReadableDataRegistration } from '..';
import { ReadableResource } from './resource';

export class ReadableDataInstance extends ReadableResource {
  dataRegistration: ReadableDataRegistration;

  constructor(public iri: string, public factory: InteropFactory, public descriptionLang?: string) {
    super(iri, factory);
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildDataRegistration();
    if (this.descriptionLang) {
      await this.dataRegistration?.shapeTree?.getDescription(this.descriptionLang);
    }
  }

  private async buildDataRegistration() {
    const dataRegistrationIri = this.iri.slice(0, this.iri.lastIndexOf('/') + 1);
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
}
