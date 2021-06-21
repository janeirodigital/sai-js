// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
import { DataFactory } from 'n3';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { ReferencesList, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://pro.alice.example/5db9103b-392c-41a4-b823-100c213e24ff';

describe('build', () => {
  test('should have referencePredicate', async () => {
    const referencesList = await ReferencesList.build(snippetIri, factory);
    const predicateNode = DataFactory.namedNode('https://vocab.example/project-management/hasTask');
    expect(referencesList.referencePredicate).toEqualRdfTerm(predicateNode);
  });
});
