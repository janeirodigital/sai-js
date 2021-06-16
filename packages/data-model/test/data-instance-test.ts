// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://home.alice.example/0fd3daa3-dd6b-4484-826b-9ebaef099241#project';

describe('build', () => {
  test('should fetch its data', async () => {
    const dataInstance = await DataInstance.build(snippetIri, factory);
    expect(dataInstance.dataset.size).toBeGreaterThan(0);
  });
});
