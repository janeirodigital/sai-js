import { BadRequestHttpError, HttpHandlerContext } from '@digita-ai/handlersjs-http';
import { of } from 'rxjs';
import { HttpSequenceContextHandler } from '../../../src';

describe('HttpSequenceContextHandler', () => {
  test('executes all context handlers once on each request', (done) => {
    const firstHandler = {
      handle: jest.fn().mockReturnValueOnce(of({ first: true }))
    };

    const secondHandler = {
      handle: jest.fn().mockReturnValueOnce(of({ second: true }))
    };

    const seqHandler = new HttpSequenceContextHandler([firstHandler, secondHandler]);
    seqHandler.handle({} as HttpHandlerContext).subscribe(() => {
      expect(firstHandler.handle.mock.calls.length).toEqual(1);
      expect(secondHandler.handle.mock.calls.length).toEqual(1);
      done();
    });
  });

  test('executes context handlers in the same order as passed in the constructors', (done) => {
    const firstHandler = {
      handle: jest.fn().mockImplementation((ctx: any) => of({ ...ctx, pristine: false, first: true }))
    };

    const secondHandler = {
      handle: jest.fn().mockImplementation((ctx: any) => of({ ...ctx, pristine: true, second: true }))
    };

    const seqHandler = new HttpSequenceContextHandler([firstHandler, secondHandler]);

    seqHandler.handle({ pristine: true } as unknown as HttpHandlerContext).subscribe((nextContext) => {
      expect(firstHandler.handle.mock.calls[0][0]['pristine']).toBe(true);
      expect(secondHandler.handle.mock.calls[0][0]['pristine']).toBe(false);
      expect(nextContext).toEqual({ pristine: true, first: true, second: true });
      done();
    });
  });

  test('aborts if any handler throws', (done) => {
    const firstHandler = {
      handle: jest.fn().mockImplementation((ctx: any) => of({ ...ctx, pristine: false, first: true }))
    };
    const secondHandler = {
      handle: jest.fn().mockImplementation((ctx: any) => {
        throw new BadRequestHttpError();
      })
    };
    const thirdHandler = {
      handle: jest.fn().mockImplementation((ctx: any) => of({ ...ctx, pristine: false, third: true }))
    };
    const seqHandler = new HttpSequenceContextHandler([firstHandler, secondHandler, thirdHandler]);
    seqHandler.handle({ pristine: true } as unknown as HttpHandlerContext).subscribe({
      error(e: Error) {
        expect(firstHandler.handle.mock.calls[0][0]['pristine']).toBe(true);
        expect(e).toBeInstanceOf(BadRequestHttpError);
        expect(thirdHandler.handle.mock.calls.length).toEqual(0);
        done();
      }
    });
  });
});
