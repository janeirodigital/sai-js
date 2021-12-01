import { DatasetCore, NamedNode } from '@rdfjs/types';
import { DataFactory } from 'n3';
import { Memoize } from 'typescript-memoize';
import { getAllMatchingQuads, getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { ReadableResource, DataInstance, InteropFactory, DataGrant, ImmutableDataGrant } from '..';

export abstract class AbstractDataGrant extends ReadableResource {
  dataset: DatasetCore;

  public constructor(iri: string, factory: InteropFactory, dataset: DatasetCore) {
    super(iri, factory);
    this.dataset = dataset;
  }

  abstract getDataInstanceIterator(): AsyncIterable<DataInstance>;

  @Memoize()
  get scopeOfGrant(): NamedNode {
    return this.getObject('scopeOfGrant');
  }

  @Memoize()
  get accessMode(): string[] {
    return this.getObjectsArray('accessMode').map((object) => object.value);
  }

  @Memoize()
  get registeredShapeTree(): string {
    return this.getObject('registeredShapeTree').value;
  }

  @Memoize()
  get hasDataRegistration(): string {
    return this.getObject('hasDataRegistration').value;
  }

  /*
   * @remarks
   * This method returns Data Instance with no dataset, it should be
   * used with `DataInstance#update` to add datset and store it on the server
   *
   * @returns new DataInstance with IRI based on prefix from ReadableDataRegistration
   */
  public static newDataInstance(sourceGrant: DataGrant, parent?: DataInstance): DataInstance {
    const iri = `${sourceGrant.iriPrefix}${sourceGrant.factory.randomUUID()}`;
    const instance = new DataInstance(iri, sourceGrant.factory);
    instance.dataGrant = sourceGrant;
    instance.draft = true;
    if (parent) {
      instance.parent = parent;
    }
    return instance;
  }

  public static iriPrefix(sourceGrant: DataGrant): string {
    const dataRegistrationPattern = [DataFactory.namedNode(sourceGrant.iri), INTEROP.hasDataRegistration, null, null];
    const dataRegistrationNode = getOneMatchingQuad(sourceGrant.dataset, ...dataRegistrationPattern)
      .object as NamedNode;
    const iriPrefixPattern = [dataRegistrationNode, INTEROP.iriPrefix, null, null];
    return getOneMatchingQuad(sourceGrant.dataset, ...iriPrefixPattern).object.value;
  }

  public checkEquivalence(otherGrant: ImmutableDataGrant): boolean {
    const predicates = [
      INTEROP.dataOwner,
      INTEROP.registeredShapeTree,
      INTEROP.hasDataRegistration,
      INTEROP.scopeOfGrant
    ];
    // INTEROP.inheritsFromGrant
    // we don't check values, just if both exist or both don't exist
    const generatedInherits = getAllMatchingQuads(
      otherGrant.dataset,
      DataFactory.namedNode(otherGrant.iri),
      INTEROP.inheritsFromGrant
    );
    const equivalentInherits = getAllMatchingQuads(
      this.dataset,
      DataFactory.namedNode(this.iri),
      INTEROP.inheritsFromGrant
    );
    if (generatedInherits.length !== equivalentInherits.length) return false;

    // INTEROP.inheritsFromGrant - inverse
    // we only check if number of statements is the same
    const generatedInverseInherits = getAllMatchingQuads(
      otherGrant.dataset,
      null,
      INTEROP.inheritsFromGrant,
      DataFactory.namedNode(otherGrant.iri)
    );
    const equivalentInverseInherits = getAllMatchingQuads(
      this.dataset,
      null,
      INTEROP.inheritsFromGrant,
      DataFactory.namedNode(this.iri)
    );
    // TODO(samurex): missing coverage
    if (generatedInverseInherits.length !== equivalentInverseInherits.length) return false;

    // INTEROP.delegationOfGrant
    // we check if either both don't exist or both exist
    // if both exist we compare values
    const generatedDelegation = getOneMatchingQuad(
      otherGrant.dataset,
      DataFactory.namedNode(otherGrant.iri),
      INTEROP.delegationOfGrant
    )?.object;
    const equivalentDelegation = getOneMatchingQuad(
      this.dataset,
      DataFactory.namedNode(this.iri),
      INTEROP.delegationOfGrant
    )?.object;
    if (generatedDelegation?.value !== equivalentDelegation?.value) return false;

    for (const predicate of predicates) {
      const generatedObject = getOneMatchingQuad(
        otherGrant.dataset,
        DataFactory.namedNode(otherGrant.iri),
        predicate
      ).object;
      const equivalentObject = getOneMatchingQuad(this.dataset, DataFactory.namedNode(this.iri), predicate).object;
      if (generatedObject.value !== equivalentObject.value) return false;
    }

    // INTEROP.accessMode
    const generatedAccessModes = getAllMatchingQuads(
      otherGrant.dataset,
      DataFactory.namedNode(otherGrant.iri),
      INTEROP.accessMode
    ).map((quad) => quad.object.value);
    const equivalentAccessModes = getAllMatchingQuads(
      this.dataset,
      DataFactory.namedNode(this.iri),
      INTEROP.accessMode
    ).map((quad) => quad.object.value);

    return (
      generatedAccessModes.length === equivalentAccessModes.length &&
      generatedAccessModes.every((mode) => equivalentAccessModes.includes(mode))
    );
  }
}
