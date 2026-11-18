export const MINI_STORAGE_KEY = 'arqpixel-minigames-v1';
const isRecord = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
export function validateMiniCatalog(value) {
    if (!Array.isArray(value) || value.length !== 5)
        throw Error('Se requieren exactamente cinco minijuegos');
    const ids = new Set();
    for (const g of value) {
        if (!isRecord(g) || typeof g.id !== 'string' || !/^[a-z-]{4,32}$/.test(g.id) || ids.has(g.id) || typeof g.title !== 'string' || typeof g.subtitle !== 'string' || typeof g.tag !== 'string' || typeof g.icon !== 'string' || !Array.isArray(g.questions) || g.questions.length !== 6)
            throw Error('Catálogo de minijuegos incompleto');
        ids.add(g.id);
        const qIds = new Set();
        for (const q of g.questions) {
            if (!isRecord(q) || typeof q.id !== 'string' || qIds.has(q.id) || typeof q.prompt !== 'string' || q.prompt.length < 25 || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some((x) => typeof x !== 'string' || x.length < 3) || typeof q.correct !== 'number' || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3 || typeof q.why !== 'string' || q.why.length < 35 || typeof q.hint !== 'string' || q.hint.length < 10)
                throw Error('Pregunta de minijuego inválida');
            qIds.add(q.id);
        }
    }
    return value;
}
export function emptyMiniProgress() { return { best: {}, plays: {} }; }
/** Returns null for corrupt data; unknown IDs are ignored rather than restored. */
export function sanitizeMiniProgress(raw, ids) {
    if (!isRecord(raw) || !isRecord(raw.best) || !isRecord(raw.plays))
        return null;
    const allowed = new Set(ids), best = {}, plays = {};
    for (const [id, score] of Object.entries(raw.best)) {
        if (!allowed.has(id))
            continue;
        if (!Number.isInteger(score) || typeof score !== 'number' || score < 0 || score > 6)
            return null;
        best[id] = score;
    }
    for (const [id, n] of Object.entries(raw.plays)) {
        if (!allowed.has(id))
            continue;
        if (!Number.isInteger(n) || typeof n !== 'number' || n < 0 || n > 100000)
            return null;
        plays[id] = n;
    }
    return { best, plays };
}
export function gradeMiniQuestion(question, choice) {
    if (!Number.isInteger(choice) || choice < 0 || choice >= question.options.length)
        throw Error('Opción fuera de rango');
    return { correct: choice === question.correct, why: question.why, referenceChoice: question.correct };
}
export function recordMiniRun(progress, game, score) {
    if (!Number.isInteger(score) || score < 0 || score > game.questions.length)
        throw Error('Puntuación inválida');
    return { best: { ...progress.best, [game.id]: Math.max(score, progress.best[game.id] || 0) }, plays: { ...progress.plays, [game.id]: Math.min(100000, (progress.plays[game.id] || 0) + 1) } };
}
export function miniStars(score) { return score === 6 ? 3 : score >= 4 ? 2 : score >= 2 ? 1 : 0; }
