import { fetch } from '../src/fetch-mock';

test('should strip fragment', async () => {
  const url = 'https://alice.example/#id';
  const { dataset } = await fetch(url);
  expect(dataset.size).toBeGreaterThan(0);
  for (const quad of dataset) {
    expect(quad.graph.value).toEqual('https://alice.example/');
  }
});

test('should get parsed data', async () => {
  const url = 'https://alice.example/';
  const { dataset } = await fetch(url);
  expect(dataset.size).toBeGreaterThan(0);
  for (const quad of dataset) {
    expect(quad.graph.value).toEqual(url);
  }
});

test('should respond with ok for other HTTP methods', async () => {
  const url = 'https://alice.example/bcbd16fb-23d9-4d9b-867c-e2e69cd94a77';
  const response = await fetch(url, { method: 'PUT' });
  expect(response.ok).toBeTruthy();
});
