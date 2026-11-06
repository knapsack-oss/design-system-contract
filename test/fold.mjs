// A reference implementation of the fold (spec/spec.md, section "The fold"), used by this repo's
// tests. Not a published package and not a checker: the specification is the source of truth.

const EMPTY = 'empty after fold';
const RESIDUAL = 'carries residual character';

/** Folds one declared name to `{ id }`, or `{ reason, residual? }` if the name is rejected. */
export function fold(name) {
  const result = name
    .replace(/[A-Z]/g, (letter) => letter.toLowerCase())
    .replace(/[ _./]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  if (result === '') return { reason: EMPTY };

  const residual = [...new Set(result)].filter((character) => !/[a-z0-9-]/.test(character));
  return residual.length > 0 ? { reason: RESIDUAL, residual } : { id: result };
}

/**
 * Folds every declared name contributing to one manifest and reports all findings together: every
 * rejection, and one collision per identifier naming all the declared names that folded to it.
 * `ids` holds only names that were neither rejected nor part of a collision.
 */
export function foldAll(names) {
  const rejections = [];
  const namesById = new Map();

  for (const name of names) {
    const { id, ...rejection } = fold(name);
    if (id === undefined) rejections.push({ name, ...rejection });
    else namesById.set(id, [...(namesById.get(id) ?? []), name]);
  }

  const ids = {};
  const collisions = [];
  for (const [id, declared] of namesById) {
    if (declared.length > 1) collisions.push({ id, names: declared });
    else ids[declared[0]] = id;
  }

  return { ids, rejections, collisions };
}
