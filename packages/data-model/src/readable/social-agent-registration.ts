import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableAccessGrant, ReadableContainer } from '.';
import { AuthorizationAgentFactory } from '..';

export class ReadableSocialAgentRegistration extends ReadableContainer {
  factory: AuthorizationAgentFactory;

  hasAccessGrant?: ReadableAccessGrant;

  reciprocalRegistration?: ReadableSocialAgentRegistration;

  reciprocal: boolean;

  public constructor(iri: string, factory: AuthorizationAgentFactory, reciprocal: boolean) {
    super(iri, factory);
    this.reciprocal = reciprocal;
  }

  @Memoize()
  get registeredAgent(): string {
    return this.getObject('registeredAgent').value;
  }

  private async buildAccessGrant(): Promise<void> {
    const accessGrantNode = this.getObject('hasAccessGrant');
    if (accessGrantNode) {
      this.hasAccessGrant = await this.factory.readable.accessGrant(accessGrantNode.value);
    }
  }

  // TODO (elf-pavlik) recover if reciprocal can't be fetched
  private async buildReciprocalRegistration(): Promise<void> {
    const quadPattern = [DataFactory.namedNode(this.iri), INTEROP.reciprocalRegistration, null, null];
    const reciprocalRegistrationIri = getOneMatchingQuad(this.dataset, ...quadPattern)?.object.value;
    if (reciprocalRegistrationIri) {
      this.reciprocalRegistration = await this.factory.readable.socialAgentRegistration(
        reciprocalRegistrationIri,
        true
      );
    }
  }

  private async bootstrap(): Promise<void> {
    await this.fetchData();
    await this.buildAccessGrant();
    if (!this.reciprocal) {
      await this.buildReciprocalRegistration();
    }
  }

  public static async build(
    iri: string,
    factory: AuthorizationAgentFactory,
    reciprocal = false
  ): Promise<ReadableSocialAgentRegistration> {
    const instance = new ReadableSocialAgentRegistration(iri, factory, reciprocal);
    await instance.bootstrap();
    return instance;
  }
}
