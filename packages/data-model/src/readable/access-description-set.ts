import { INTEROP } from '@janeirodigital/interop-namespaces';
import { InteropFactory } from '..';
import { ReadableResource } from './resource';

export class ReadableAccessDescriptionSet extends ReadableResource {
  private get descriptionSubjects() {
    return this.getQuadArray(null, INTEROP.inAccessDescriptionSet).map((quad) => quad.subject);
  }

  get accessNeedGroupDescriptions(): string[] {
    return this.descriptionSubjects
      .filter((subject) => this.dataset.match(subject, INTEROP.hasAccessNeedGroup).size)
      .map((subject) => subject.value);
  }

  get accessNeedDescriptions(): string[] {
    return this.descriptionSubjects
      .filter((subject) => this.dataset.match(subject, INTEROP.hasAccessNeed).size)
      .map((subject) => subject.value);
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableAccessDescriptionSet> {
    const instance = new ReadableAccessDescriptionSet(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
