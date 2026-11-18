/**
 * Lightweight, zero-dependency Zod 4-compatible runtime validator for offline execution
 * of the NexoShop reference module. Preserves `.pick()`, `.extend()` and `z.infer` / `z.output`.
 */

export interface ZType<TOut> {
  readonly _output?: TOut;
  parse(input: unknown, path?: string): TOut;
}

export type ZShape = Record<string, ZType<unknown>>;

export type InferZShape<S extends ZShape> = {
  [K in keyof S]: S[K] extends ZType<infer V> ? V : never;
};

export interface ZObject<S extends ZShape> extends ZType<InferZShape<S>> {
  readonly shape: S;
  pick<K extends keyof S>(keys: Readonly<Record<K, true>>): ZObject<Pick<S, K>>;
  extend<E extends ZShape>(extra: E): ZObject<Omit<S, keyof E> & E>;
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function assertPlainObject(val: unknown, path: string): Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw new Error(`${path}: se esperaba un objeto JSON plano`);
  }
  for (const key of Object.getOwnPropertyNames(val)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`${path}: clave prohibida detectada (${key})`);
    }
  }
  return val as Record<string, unknown>;
}

function makeObject<S extends ZShape>(shape: S): ZObject<S> {
  return {
    shape,
    parse(input: unknown, path = '$'): InferZShape<S> {
      const rec = assertPlainObject(input, path);
      const out: Record<string, unknown> = {};
      for (const [key, validator] of Object.entries(shape)) {
        out[key] = validator.parse(rec[key], `${path}.${key}`);
      }
      for (const extra_key of Object.keys(rec)) {
        if (!Object.prototype.hasOwnProperty.call(shape, extra_key)) {
          throw new Error(`${path}.${extra_key}: propiedad no permitida en contrato estricto`);
        }
      }
      return out as InferZShape<S>;
    },
    pick<K extends keyof S>(keys: Readonly<Record<K, true>>): ZObject<Pick<S, K>> {
      const picked: Partial<Pick<S, K>> = {};
      for (const k of Object.keys(keys) as K[]) {
        if (keys[k] && shape[k]) picked[k] = shape[k];
      }
      return makeObject(picked as Pick<S, K>);
    },
    extend<E extends ZShape>(extra: E): ZObject<Omit<S, keyof E> & E> {
      return makeObject({ ...shape, ...extra } as Omit<S, keyof E> & E);
    },
  };
}

export const z = {
  object: makeObject,
  string(opts: { min?: number; max?: number; pattern?: RegExp } = {}): ZType<string> {
    return {
      parse(input: unknown, path = '$'): string {
        if (typeof input !== 'string') throw new Error(`${path}: se esperaba string`);
        const trimmed = input.trim();
        if (opts.min !== undefined && trimmed.length < opts.min) {
          throw new Error(`${path}: longitud mínima ${opts.min}`);
        }
        if (opts.max !== undefined && input.length > opts.max) {
          throw new Error(`${path}: longitud máxima ${opts.max}`);
        }
        if (opts.pattern && !opts.pattern.test(input)) {
          throw new Error(`${path}: formato inválido`);
        }
        return input;
      },
    };
  },
  int(opts: { min?: number; max?: number } = {}): ZType<number> {
    return {
      parse(input: unknown, path = '$'): number {
        if (typeof input !== 'number' || !Number.isInteger(input)) {
          throw new Error(`${path}: se esperaba entero`);
        }
        if (opts.min !== undefined && input < opts.min) {
          throw new Error(`${path}: mínimo ${opts.min}`);
        }
        if (opts.max !== undefined && input > opts.max) {
          throw new Error(`${path}: máximo ${opts.max}`);
        }
        return input;
      },
    };
  },
  enum<const T extends string>(allowed: readonly T[]): ZType<T> {
    return {
      parse(input: unknown, path = '$'): T {
        if (typeof input !== 'string' || !allowed.includes(input as T)) {
          throw new Error(`${path}: valor fuera de enum (${allowed.join(' | ')})`);
        }
        return input as T;
      },
    };
  },
  array<T>(item: ZType<T>, opts: { min?: number; max?: number } = {}): ZType<T[]> {
    return {
      parse(input: unknown, path = '$'): T[] {
        if (!Array.isArray(input)) throw new Error(`${path}: se esperaba array`);
        if (opts.min !== undefined && input.length < opts.min) {
          throw new Error(`${path}: mínimo ${opts.min} elementos`);
        }
        if (opts.max !== undefined && input.length > opts.max) {
          throw new Error(`${path}: máximo ${opts.max} elementos`);
        }
        return input.map((val, idx) => item.parse(val, `${path}[${idx}]`));
      },
    };
  },
};

export namespace z {
  export type infer<T extends ZType<unknown>> = T extends ZType<infer Out> ? Out : never;
  export type output<T extends ZType<unknown>> = T extends ZType<infer Out> ? Out : never;
}
