export async function iterable2array<T>(asyncIterable: AsyncIterable<T>): Promise<T[]> {
  const arr: T[] = [];
  for await (const item of asyncIterable) {
    arr.push(item);
  }
  return arr;
}
