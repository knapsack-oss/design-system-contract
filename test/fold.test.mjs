// Runs the fold's conformance fixtures against the reference implementation in fold.mjs.
// The fixtures hold the specification's worked examples (SCN-014, SCN-015) plus cases that catch
// the likely implementation mistakes: locale-aware lowercasing and Unicode normalization.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fold, foldAll } from './fold.mjs';

const fixtures = JSON.parse(readFileSync(new URL('fixtures/fold.json', import.meta.url), 'utf8'));
const CONTRACT_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DSDS_ID = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*$/;

for (const { name, id, source } of fixtures.folds) {
  test(`fold ${JSON.stringify(name)} is ${id} (${source})`, () => {
    assert.deepEqual(fold(name), { id });
  });
}

for (const { name, reason, residual, source } of fixtures.rejections) {
  test(`fold rejects ${JSON.stringify(name)}: ${reason} (${source})`, () => {
    assert.deepEqual(fold(name), residual ? { reason, residual } : { reason });
  });
}

test('SCN-014: every result is a valid contractId and a valid DSDS id', () => {
  for (const { id } of fixtures.folds) {
    assert.match(id, CONTRACT_ID);
    assert.match(id, DSDS_ID);
  }
});

test('SCN-014: a 300-character name folds to a 300-character identifier', () => {
  const name = 'A'.repeat(300);
  assert.deepEqual(fold(name), { id: 'a'.repeat(300) });
});

test('SCN-015: one publish reports every rejection and one collision per identifier', () => {
  const { names, ids, rejections, collisions } = fixtures.publish;
  assert.deepEqual(foldAll(names), { ids, rejections, collisions });
});
