import { fetch } from '../src/fetch-mock';

test('should strip fragment', async () => {
  const url = 'https://alice.example/#id';
  const response = await fetch(url);
  const dataset = await response.dataset();
  expect(dataset.size).toBeGreaterThan(0);
  for (const quad of dataset) {
    expect(quad.graph.value).toEqual('https://alice.example/');
  }
});

test('should get parsed data', async () => {
  const url = 'https://alice.example/';
  const response = await fetch(url);
  const dataset = await response.dataset();
  expect(dataset.size).toBeGreaterThan(0);
  for (const quad of dataset) {
    expect(quad.graph.value).toEqual(url);
  }
});

test('should respond with ok for other HTTP methods', async () => {
  const url = 'https://pro.alice.example/bcbd16fb-23d9-4d9b-867c-e2e69cd94a77';
  const response = await fetch(url, { method: 'PUT' });
  expect(response.ok).toBeTruthy();
});

test('should not set dataset if Accept other than text/turtle', async () => {
  const url = 'https://solidshapes.example/shapes/Project';
  const response = await fetch(url, { headers: { Accept: 'text/shex' } });
  expect(response.dataset).toBeUndefined();
});

test('should set dataset if Accept set text/turtle', async () => {
  const url = 'https://pro.alice.example/ccbd77ae-f769-4e07-b41f-5136501e13e7#project';
  const response = await fetch(url, { headers: { Accept: 'text/turtle' } });
  const dataset = await response.dataset();
  expect(dataset.size).toBeGreaterThan(0);
});

test('should set text on response', async () => {
  const url = 'https://solidshapes.example/shapes/Project';
  const response = await fetch(url, { headers: { Accept: 'text/shex' } });
  const text = await response.text();
  expect(text.length).toBeGreaterThan(0);
});
