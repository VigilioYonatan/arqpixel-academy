/**
 * Lightweight, zero-dependency Zod 4-compatible runtime validator for offline execution
 * of the NexoShop reference module. Preserves `.pick()`, `.extend()` and `z.infer` / `z.output`.
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function assertPlainObject(val, path) {
    if (typeof val !== 'object' || val === null || Array.isArray(val)) {
        throw new Error(`${path}: se esperaba un objeto JSON plano`);
    }
    for (const key of Object.getOwnPropertyNames(val)) {
        if (FORBIDDEN_KEYS.has(key)) {
            throw new Error(`${path}: clave prohibida detectada (${key})`);
        }
    }
    return val;
}
function makeObject(shape) {
    return {
        shape,
        parse(input, path = '$') {
            const rec = assertPlainObject(input, path);
            const out = {};
            for (const [key, validator] of Object.entries(shape)) {
                out[key] = validator.parse(rec[key], `${path}.${key}`);
            }
            for (const extra_key of Object.keys(rec)) {
                if (!Object.prototype.hasOwnProperty.call(shape, extra_key)) {
                    throw new Error(`${path}.${extra_key}: propiedad no permitida en contrato estricto`);
                }
            }
            return out;
        },
        pick(keys) {
            const picked = {};
            for (const k of Object.keys(keys)) {
                if (keys[k] && shape[k])
                    picked[k] = shape[k];
            }
            return makeObject(picked);
        },
        extend(extra) {
            return makeObject({ ...shape, ...extra });
        },
    };
}
export const z = {
    object: makeObject,
    string(opts = {}) {
        return {
            parse(input, path = '$') {
                if (typeof input !== 'string')
                    throw new Error(`${path}: se esperaba string`);
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
    int(opts = {}) {
        return {
            parse(input, path = '$') {
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
    enum(allowed) {
        return {
            parse(input, path = '$') {
                if (typeof input !== 'string' || !allowed.includes(input)) {
                    throw new Error(`${path}: valor fuera de enum (${allowed.join(' | ')})`);
                }
                return input;
            },
        };
    },
    array(item, opts = {}) {
        return {
            parse(input, path = '$') {
                if (!Array.isArray(input))
                    throw new Error(`${path}: se esperaba array`);
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
