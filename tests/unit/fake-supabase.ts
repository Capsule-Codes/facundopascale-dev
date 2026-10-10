import { vi } from 'vitest';

export type Call = [method: string, ...args: unknown[]];
export type Result = { data: unknown; error: unknown };

/**
 * Chainable, awaitable stand-in for the Supabase client. Each `from()` consumes
 * the next queued result (the last one repeats) and every builder call is
 * recorded, so tests can assert tables, filters and the exact columns written.
 */
export function fakeClient(...results: Result[]) {
  const calls: Call[] = [];
  const targets: { schema: string; table: string }[] = [];
  let index = 0;
  const client = {
    schema: vi.fn((schema: string) => ({
      from: (table: string) => {
        targets.push({ schema, table });
        const result = results[Math.min(index, results.length - 1)]!;
        index += 1;
        const builder: Record<string, unknown> = {};
        for (const method of [
          'select',
          'eq',
          'order',
          'insert',
          'update',
          'delete',
          'limit',
          'single',
          'maybeSingle',
        ]) {
          builder[method] = (...args: unknown[]) => {
            calls.push([method, ...args]);
            return builder;
          };
        }
        builder.then = (resolve: (value: unknown) => unknown) =>
          Promise.resolve(result).then(resolve);
        return builder;
      },
    })),
  };
  return { client: client as never, calls, targets };
}

export function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
