// D-87: a prop's default and enum values must fit its declared type.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const load = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(load('schemas/component.contract.schema.json'));
const prop = (schema, name = 'a') =>
  validate({ contractId: 'x', component: 'X', props: { properties: { [name]: schema }, additionalProperties: false } });

const fits = [
  ['string', 'a'], ['number', 1.5], ['number', 2], ['integer', 2], ['integer', 2.0], ['boolean', false],
  ['array', []], ['object', {}], ['null', null],
  [['string', 'null'], null], [['string', 'null'], 'a'], [['integer', 'string'], 3], [['number', 'boolean'], true],
];
const misfits = [
  ['string', 1], ['string', null], ['number', '1'], ['integer', 1.5], ['integer', '1'], ['boolean', 'yes'],
  ['boolean', 0], ['array', {}], ['object', []], ['null', 'null'],
  [['string', 'null'], 1], [['integer', 'string'], 1.5], [['number', 'boolean'], 'a'],
];

for (const [type, value] of fits) {
  const label = `${JSON.stringify(type)} with ${JSON.stringify(value)}`;
  test(`SCN-024: default fits: ${label}`, () => assert.ok(prop({ type, default: value }), JSON.stringify(validate.errors)));
  test(`SCN-024: enum fits: ${label}`, () => assert.ok(prop({ type, enum: [value] }), JSON.stringify(validate.errors)));
}
for (const [type, value] of misfits) {
  const label = `${JSON.stringify(type)} with ${JSON.stringify(value)}`;
  test(`SCN-024: default misfit: ${label}`, () => assert.ok(!prop({ type, default: value })));
  test(`SCN-024: enum misfit: ${label}`, () => assert.ok(!prop({ type, enum: [value] })));
}

test('SCN-024: one bad enum value among good ones fails', () => {
  assert.ok(!prop({ type: 'string', enum: ['a', 1] }));
});

test('SCN-024: enum has at least one value and no duplicates', () => {
  assert.ok(!prop({ type: 'string', enum: [] }));
  assert.ok(!prop({ type: 'string', enum: ['a', 'a'] }));
});

test('SCN-024: a prop name is not empty', () => {
  assert.ok(!prop({ type: 'string' }, ''));
});

test('SCN-024: the schema still compiles under Ajv strict mode, and props still compile as a schema', () => {
  const props = { properties: { a: { type: 'string', enum: ['b'], default: 'b' } }, additionalProperties: false };
  assert.ok(new Ajv2020({ strict: false }).compile(props)({ a: 'b' }));
});
