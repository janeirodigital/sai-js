import { DataFactory } from 'n3';
import { NamedNode } from '@rdfjs/types';
import { INTEROP, RDF } from '@janeirodigital/interop-namespaces';
import { ApplicationFactory, AuthorizationAgentFactory, DataGrant, ImmutableResource } from '..';
import { getAllMatchingQuads, getOneMatchingQuad } from '@janeirodigital/interop-utils';

type StringData = {
  dataOwner: string;
  registeredShapeTree: string;
  hasDataRegistration: string;
  scopeOfGrant: string;
  inheritsFromGrant?: string;
  delegationOfGrant?: string;
};

type ArrayData = {
  accessMode: string[];
  creatorAccessMode?: string[];
  hasDataInstance?: string[];
};

type InverseArrayData = {
  hasInheritingGrant?: string[];
};

export type DataGrantData = StringData & ArrayData & InverseArrayData;

export class ImmutableDataGrant extends ImmutableResource {
  public constructor(iri: string, factory: AuthorizationAgentFactory, data: DataGrantData) {
    super(iri, factory, data);
    const thisNode = DataFactory.namedNode(this.iri);
    const props: (keyof StringData)[] = [
      'dataOwner',
      'registeredShapeTree',
      'hasDataRegistration',
      'scopeOfGrant',
      'inheritsFromGrant',
      'delegationOfGrant'
    ];

    // set type
    const type: NamedNode = data.delegationOfGrant ? INTEROP.DelegatedDataGrant : INTEROP.DataGrant;
    this.dataset.add(DataFactory.quad(thisNode, RDF.type, type));
    // set string data
    for (const prop of props) {
      if (data[prop]) {
        this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(data[prop])));
      }
    }
    const arrProps: (keyof ArrayData)[] = ['accessMode', 'creatorAccessMode', 'hasDataInstance'];
    for (const prop of arrProps) {
      if (data[prop]) {
        for (const element of data[prop]) {
          this.dataset.add(DataFactory.quad(thisNode, INTEROP[prop], DataFactory.namedNode(element)));
        }
      }
    }
    if (data.hasInheritingGrant) {
      for (const child of data.hasInheritingGrant) {
        this.dataset.add(DataFactory.quad(DataFactory.namedNode(child), INTEROP.inheritsFromGrant, thisNode));
      }
    }
  }
  public checkEquivalence(otherGrant: DataGrant): boolean {
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
