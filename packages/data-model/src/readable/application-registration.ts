import { ReadableAccessGrant, InteropFactory, ReadableContainer } from '..';

export class ReadableApplicationRegistration extends ReadableContainer {
  hasAccessGrant: ReadableAccessGrant;

  private async buildAccessGrant(): Promise<void> {
    const accessGrantNode = this.getObject('hasAccessGrant');
    this.hasAccessGrant = await this.factory.readable.accessGrant(accessGrantNode.value);
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildAccessGrant();
  }

  public static async build(iri: string, factory: InteropFactory): Promise<ReadableApplicationRegistration> {
    const instance = new ReadableApplicationRegistration(iri, factory);
    await instance.bootstrap();
    return instance;
  }
}
