/**
 * Zero-dependency, browser-safe runtime schema validator with static TypeScript inference.
 * Rejects prototype-pollution keys and non-plain objects at system boundaries (ADR-0002).
 */
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
export function isSafePlainObject(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return false;
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null)
        return false;
    for (const key of Object.getOwnPropertyNames(value)) {
        if (FORBIDDEN_OBJECT_KEYS.has(key))
            return false;
    }
    return true;
}
function createValidator(runner, isOptional = false) {
    return {
        isOptional,
        safeParse(input, path = '$') {
            return runner(input, path);
        },
        parse(input, path = '$') {
            const result = runner(input, path);
            if (!result.success) {
                const detail = result.issues.map((item) => `${item.path}: ${item.message}`).join('; ');
                throw new Error(`Validación de esquema fallida (${detail})`);
            }
            return result.data;
        },
        refine(predicate, message) {
            return createValidator((input, path) => {
                const base = runner(input, path);
                if (!base.success)
                    return base;
                if (!predicate(base.data)) {
                    return { success: false, issues: [{ path, message }] };
                }
                return base;
            }, isOptional);
        },
        optional() {
            return createValidator((input, path) => {
                if (input === undefined)
                    return { success: true, data: undefined };
                return runner(input, path);
            }, true);
        },
        nullable() {
            return createValidator((input, path) => {
                if (input === null)
                    return { success: true, data: null };
                return runner(input, path);
            }, isOptional);
        },
    };
}
export const s = {
    string(options = {}) {
        return createValidator((input, path) => {
            if (typeof input !== 'string') {
                return { success: false, issues: [{ path, message: 'Se esperaba texto (string)' }] };
            }
            if (options.min !== undefined && input.length < options.min) {
                return { success: false, issues: [{ path, message: `Longitud mínima ${options.min}` }] };
            }
            if (options.max !== undefined && input.length > options.max) {
                return { success: false, issues: [{ path, message: `Longitud máxima ${options.max}` }] };
            }
            if (options.trimMin !== undefined && input.trim().length < options.trimMin) {
                return { success: false, issues: [{ path, message: `Texto útil mínimo ${options.trimMin}` }] };
            }
            if (options.pattern && !options.pattern.test(input)) {
                return { success: false, issues: [{ path, message: 'Formato inválido' }] };
            }
            return { success: true, data: input };
        });
    },
    number(options = {}) {
        return createValidator((input, path) => {
            if (typeof input !== 'number' || !Number.isFinite(input)) {
                return { success: false, issues: [{ path, message: 'Se esperaba número finito' }] };
            }
            if (options.int && !Number.isInteger(input)) {
                return { success: false, issues: [{ path, message: 'Se esperaba entero' }] };
            }
            if (options.min !== undefined && input < options.min) {
                return { success: false, issues: [{ path, message: `Mínimo permitido ${options.min}` }] };
            }
            if (options.max !== undefined && input > options.max) {
                return { success: false, issues: [{ path, message: `Máximo permitido ${options.max}` }] };
            }
            return { success: true, data: input };
        });
    },
    boolean() {
        return createValidator((input, path) => {
            if (typeof input !== 'boolean') {
                return { success: false, issues: [{ path, message: 'Se esperaba booleano' }] };
            }
            return { success: true, data: input };
        });
    },
    literal(expected) {
        return createValidator((input, path) => {
            if (input !== expected) {
                return { success: false, issues: [{ path, message: `Se esperaba literal ${String(expected)}` }] };
            }
            return { success: true, data: expected };
        });
    },
    enum(values) {
        const allowed = new Set(values);
        return createValidator((input, path) => {
            if (typeof input !== 'string' || !allowed.has(input)) {
                return { success: false, issues: [{ path, message: `Valor fuera de conjunto permitido (${values.join(', ')})` }] };
            }
            return { success: true, data: input };
        });
    },
    array(itemSchema, options = {}) {
        return createValidator((input, path) => {
            if (!Array.isArray(input)) {
                return { success: false, issues: [{ path, message: 'Se esperaba arreglo' }] };
            }
            if (options.min !== undefined && input.length < options.min) {
                return { success: false, issues: [{ path, message: `Mínimo ${options.min} elementos` }] };
            }
            if (options.max !== undefined && input.length > options.max) {
                return { success: false, issues: [{ path, message: `Máximo ${options.max} elementos` }] };
            }
            const output = [];
            const issues = [];
            for (let i = 0; i < input.length; i++) {
                const parsed = itemSchema.safeParse(input[i], `${path}[${i}]`);
                if (!parsed.success) {
                    issues.push(...parsed.issues);
                    if (issues.length >= 10)
                        break;
                }
                else {
                    output.push(parsed.data);
                }
            }
            if (issues.length > 0)
                return { success: false, issues };
            return { success: true, data: output };
        });
    },
    tuple2(first, second) {
        return createValidator((input, path) => {
            if (!Array.isArray(input) || input.length !== 2) {
                return { success: false, issues: [{ path, message: 'Se esperaba par [origen, destino]' }] };
            }
            const left = first.safeParse(input[0], `${path}[0]`);
            const right = second.safeParse(input[1], `${path}[1]`);
            if (!left.success || !right.success) {
                return {
                    success: false,
                    issues: [...(left.success ? [] : left.issues), ...(right.success ? [] : right.issues)],
                };
            }
            return { success: true, data: [left.data, right.data] };
        });
    },
    record(keySchema, valueSchema, options = {}) {
        return createValidator((input, path) => {
            if (!isSafePlainObject(input)) {
                return { success: false, issues: [{ path, message: 'Objeto inválido o con claves prohibidas' }] };
            }
            const keys = Object.keys(input);
            if (options.maxKeys !== undefined && keys.length > options.maxKeys) {
                return { success: false, issues: [{ path, message: `Excede máximo de ${options.maxKeys} claves` }] };
            }
            const output = {};
            const issues = [];
            for (const key of keys) {
                const kRes = keySchema.safeParse(key, `${path}.${key}`);
                if (!kRes.success) {
                    issues.push(...kRes.issues);
                    continue;
                }
                const vRes = valueSchema.safeParse(input[key], `${path}.${key}`);
                if (!vRes.success) {
                    issues.push(...vRes.issues);
                }
                else {
                    output[kRes.data] = vRes.data;
                }
                if (issues.length >= 10)
                    break;
            }
            if (issues.length > 0)
                return { success: false, issues };
            return { success: true, data: output };
        });
    },
    plainObject() {
        return createValidator((input, path) => {
            if (!isSafePlainObject(input)) {
                return { success: false, issues: [{ path, message: 'Objeto JSON plano requerido (sin __proto__/constructor)' }] };
            }
            for (const val of Object.values(input)) {
                if (typeof val === 'function' || typeof val === 'symbol') {
                    return { success: false, issues: [{ path, message: 'Tipo ejecutable no permitido en JSON' }] };
                }
            }
            return { success: true, data: input };
        });
    },
    object(shape, options = {}) {
        const allowedKeys = new Set(Object.keys(shape));
        return createValidator((input, path) => {
            if (!isSafePlainObject(input)) {
                return { success: false, issues: [{ path, message: 'Se esperaba objeto plano seguro' }] };
            }
            const issues = [];
            if (options.strict) {
                for (const key of Object.keys(input)) {
                    if (!allowedKeys.has(key)) {
                        issues.push({ path: `${path}.${key}`, message: 'Propiedad desconocida no permitida' });
                    }
                }
            }
            const output = {};
            for (const [key, validator] of Object.entries(shape)) {
                const rawVal = Object.prototype.hasOwnProperty.call(input, key) ? input[key] : undefined;
                const parsed = validator.safeParse(rawVal, `${path}.${key}`);
                if (!parsed.success) {
                    issues.push(...parsed.issues);
                }
                else if (parsed.data !== undefined || Object.prototype.hasOwnProperty.call(input, key)) {
                    output[key] = parsed.data;
                }
            }
            if (issues.length > 0)
                return { success: false, issues };
            return { success: true, data: output };
        });
    },
};
