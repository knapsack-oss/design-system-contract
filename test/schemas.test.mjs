// Checks the published schemas and examples against the spec's acceptance criteria.
// Offline and deterministic: a stock JSON Schema 2020-12 validator (Ajv) and an
// RFC 8785 canonicalizer, nothing else. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import canonicalize from 'canonicalize';

const root = new URL('../', import.meta.url);
const load = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const clone = (o) => structuredClone(o);

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateContract = ajv.compile(load('schemas/component.contract.schema.json'));
const validateManifest = ajv.compile(load('schemas/manifest.schema.json'));

const example = load('examples/button-primary.contract.json');
const exportsExample = load('examples/icon-badge.contract.json');
const manifest = load('examples/manifest.json');
const minimal = { contractId: 'button-primary', component: 'Button Primary' };
const contract = (extra) => validateContract({ ...clone(minimal), ...extra });
const withRecord = (extra) =>
  validateManifest({ ...clone(manifest), artifacts: [{ ...manifest.artifacts[0], ...extra }] });

const address = (doc) =>
  'sha256:' + createHash('sha256').update(canonicalize(doc), 'utf8').digest('hex');

test('examples validate', () => {
  assert.ok(validateContract(example), JSON.stringify(validateContract.errors));
  assert.ok(validateContract(exportsExample), JSON.stringify(validateContract.errors));
  assert.ok(validateManifest(manifest), JSON.stringify(validateManifest.errors));
});

test('manifest address equals sha256 of the RFC 8785 canonical form', () => {
  for (const record of manifest.artifacts) {
    assert.equal(address(load(`examples/${record.path}`)), record.address);
  }
});

test('glossary canonical-form example is 60 bytes', () => {
  const bytes = canonicalize({ contractId: 'button-primary', component: 'Button Primary' });
  assert.equal(bytes, '{"component":"Button Primary","contractId":"button-primary"}');
  assert.equal(Buffer.byteLength(bytes), 60);
});

test('props is itself a usable JSON Schema 2020-12 schema', () => {
  const validateProps = new Ajv2020({ strict: false }).compile(example.props);
  assert.ok(validateProps({ label: 'Go' }));
  assert.ok(!validateProps({}), 'missing required label');
  assert.ok(!validateProps({ label: 'Go', size: 'lg' }), 'undeclared prop on a closed set');
  assert.ok(!validateProps({ label: 'Go', variant: 'tertiary' }), 'value outside enum');
});

test('SCN-010: contract identity and root members', () => {
  assert.ok(validateContract(minimal));
  assert.ok(!validateContract({ contractId: 'button-primary' }), 'component required');
  assert.ok(!contract({ component: '' }), 'component non-empty');
  assert.ok(!contract({ variants: {} }), 'no variants member');
  for (const id of ['Button_Primary', 'acme.button.v1', 'button--primary', '-button']) {
    assert.ok(!contract({ contractId: id }), `contractId ${id} fails the pattern`);
  }
});

test('SCN-011: typed props', () => {
  assert.ok(!contract({ props: { properties: { label: { type: 'string' } } } }), 'flag required');
  assert.ok(!contract({ props: { properties: { n: { type: 'number', minimum: 0 } }, additionalProperties: false } }));
  assert.ok(!contract({ props: { properties: { n: { type: 'text' } }, additionalProperties: false } }));
  assert.ok(!contract({ props: { properties: { label: {} }, additionalProperties: false } }), 'type required');
  assert.ok(contract({ props: { properties: { n: { type: ['string', 'null'] } }, additionalProperties: false } }));
});

test('SCN-012: empty prop sets', () => {
  assert.ok(contract({ props: { additionalProperties: false } }));
  assert.ok(contract({ props: { properties: {}, additionalProperties: false } }));
  assert.ok(contract({ props: { additionalProperties: true } }));
  assert.ok(!contract({ props: {} }));
  assert.ok(!contract({ props: { properties: {} } }));
});

test('SCN-013: slots and states', () => {
  assert.ok(contract({ slots: ['icon', { name: 'body', a11y: { nameFrom: 'content', required: true } }], states: ['hover'] }));
  assert.ok(!contract({ slots: [{ name: 'body', extra: 1 }] }));
  assert.ok(!contract({ states: [''] }));
});

test('SCN-016: manifest shape', () => {
  assert.ok(!validateManifest({ ...clone(manifest), signer: null }));
  assert.ok(!validateManifest({ ...clone(manifest), syncTimestamp: 'x' }));
  assert.ok(!validateManifest({ artifacts: [] }), 'contractVersion required');
  assert.ok(!withRecord({ origin: 'authored' }));
  assert.ok(withRecord({ origin: 'inferred' }));
  assert.ok(!withRecord({ ratified: true }));
  assert.ok(!withRecord({ address: 'sha256:ABC' }));
});

test('SCN-020: export records by kind', () => {
  const js = { kind: 'js', name: 'Button', specifier: '@acme/ui' };
  const tag = { kind: 'custom-element', tagName: 'acme-button' };
  const sel = { kind: 'angular-selector', selector: 'button[acme-button], a[acme-button]' };
  assert.ok(contract({ exports: [js] }));
  assert.ok(contract({ exports: [js, tag] }), 'a custom element: module plus tag');
  assert.ok(contract({ exports: [js, sel] }), 'an Angular component: import plus selector');
  assert.ok(contract({ exports: [{ ...js, name: 'default', specifier: '@acme/ui/button' }] }), 'default export');
  assert.ok(!contract({ exports: [] }), 'at least one record');
  assert.ok(!contract({ exports: [js, { ...js }] }), 'records unique');
  assert.ok(!contract({ exports: [{ name: 'Button', specifier: '@acme/ui' }] }), 'kind required');
  assert.ok(!contract({ exports: [{ kind: 'swift', name: 'Button', module: 'AcmeUI' }] }), 'unknown kind rejected');
  assert.ok(!contract({ exports: [{ ...js, name: '*' }] }), 'no aggregate export');
  assert.ok(!contract({ exports: [{ ...js, package: '@acme/ui' }] }), 'js record closed');
  assert.ok(!contract({ exports: [{ kind: 'js', name: 'Button' }] }), 'specifier required');
  assert.ok(!contract({ exports: [{ ...tag, tagName: 'button' }] }), 'tag needs a hyphen');
  assert.ok(!contract({ exports: [{ ...tag, tagName: 'Acme-Button' }] }), 'tag is lowercase');
  assert.ok(!contract({ exports: [{ ...sel, selector: '' }] }), 'selector non-empty');
});

test('SCN-020: identity comes from the declared name, not an export record', () => {
  assert.equal(exportsExample.contractId, 'iconbadge', 'fold of the declared name IconBadge');
  assert.ok(exportsExample.exports.some((r) => r.name === 'default'), 'a default export does not rename the contract');
  assert.ok(exportsExample.exports.some((r) => r.name === 'StatusBadge'), 'an alias is one more record, not one more contract');
});
