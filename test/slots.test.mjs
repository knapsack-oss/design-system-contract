// D-85: the rules a slot can state about what fills it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const load = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(load('schemas/component.contract.schema.json'));
const slot = (record) => validate({ contractId: 'card', component: 'Card', slots: [{ name: 'body', ...record }] });

test('SCN-022: the example contract with slot rules validates', () => {
  assert.ok(validate(load('examples/card.contract.json')), JSON.stringify(validate.errors));
});

test('SCN-022: a slot can state how many children it takes', () => {
  assert.ok(slot({ minChildren: 1 }), 'required');
  assert.ok(slot({ maxChildren: 1 }), 'only one');
  assert.ok(slot({ minChildren: 1, maxChildren: 1 }), 'exactly one');
  assert.ok(slot({ minChildren: 0 }), 'optional, said out loud');
  assert.ok(!slot({ minChildren: -1 }));
  assert.ok(!slot({ minChildren: 1.5 }));
  assert.ok(!slot({ maxChildren: 0 }), 'a slot that takes nothing is not a slot');
});

test('SCN-022: a slot can state what may fill it', () => {
  assert.ok(slot({ accepts: ['button-primary', 'icon'] }));
  assert.ok(slot({ allowsText: false }), 'components only');
  assert.ok(slot({ allowsText: true }));
  assert.ok(slot({ accepts: [] }), 'text only');
  assert.ok(slot({ accepts: ['icon'], allowsText: false }));
  assert.ok(!slot({ accepts: ['Button_Primary'] }), 'entries are contractIds');
  assert.ok(!slot({ accepts: ['icon', 'icon'] }), 'entries are unique');
  assert.ok(!slot({ accepts: 'icon' }));
  assert.ok(!slot({ allowsText: 'no' }));
  assert.ok(!slot({ accepts: [], allowsText: false }), 'nothing could fill it');
});

test('SCN-022: a bare slot name and an existing record stay valid', () => {
  assert.ok(validate({ contractId: 'card', component: 'Card', slots: ['icon'] }));
  assert.ok(slot({ a11y: { nameFrom: 'content', required: true } }));
  assert.ok(!slot({ isRequired: true }), 'one spelling per fact');
});
