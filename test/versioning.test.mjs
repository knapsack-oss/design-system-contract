// D-84: how the closed schemas change version, and what stays out of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const root = new URL('../', import.meta.url);
const load = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const contractSchema = load('schemas/component.contract.schema.json');
const manifestSchema = load('schemas/manifest.schema.json');
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateContract = ajv.compile(contractSchema);
const validateManifest = ajv.compile(manifestSchema);
const minimal = { contractId: 'button', component: 'Button' };
const record = { path: 'button.contract.json', address: `sha256:${'a'.repeat(64)}`, origin: 'synced' };

test('SCN-021: each schema version has its own $id', () => {
  const base = 'https://knapsack-oss.github.io/design-system-contract/schemas/v0.2/';
  assert.equal(contractSchema.$id, `${base}component.contract.schema.json`);
  assert.equal(manifestSchema.$id, `${base}manifest.schema.json`);
});

test('SCN-021: every example names the schema version it was written against', () => {
  const examples = readdirSync(new URL('examples/', root));
  for (const file of examples) {
    const expected = file === 'manifest.json' ? manifestSchema.$id : contractSchema.$id;
    assert.equal(load(`examples/${file}`).$schema, expected, file);
  }
});

test('SR-153: no x- extension member anywhere a contract or manifest is closed', () => {
  const prop = (extra) => ({ ...minimal, props: { properties: { a: { type: 'string', ...extra } }, additionalProperties: false } });
  assert.ok(!validateContract({ ...minimal, 'x-acme': 1 }), 'contract root');
  assert.ok(!validateContract(prop({ 'x-tsType': 'Foo' })), 'prop');
  assert.ok(!validateContract({ ...minimal, slots: [{ name: 'a', 'x-acme': 1 }] }), 'slot');
  assert.ok(!validateManifest({ contractVersion: '1', artifacts: [], 'x-acme': 1 }), 'manifest root');
  assert.ok(!validateManifest({ contractVersion: '1', artifacts: [{ ...record, 'x-acme': 1 }] }), 'artifact record');
});

test('SR-154: closed stays the default, with no way to open a prop set by pattern', () => {
  const withProps = (props) => validateContract({ ...minimal, props });
  assert.ok(validateContract(minimal), 'no props member reads as closed');
  assert.ok(withProps({ additionalProperties: false }));
  assert.ok(!withProps({ properties: {}, patternProperties: { '^aria-': {} }, additionalProperties: false }));
  assert.ok(
    withProps({ properties: { 'aria-label': { type: 'string' } }, additionalProperties: false }),
    'a DOM attribute the component governs is an ordinary declared prop',
  );
});
