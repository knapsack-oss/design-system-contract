// D-88: a contract names the events a component emits, and leaves their signatures to the compiler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const load = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(load('schemas/component.contract.schema.json'));
const events = (value) => validate({ contractId: 'dialog', component: 'Dialog', events: value });
const example = load('examples/dialog.contract.json');

test('SCN-025: the example contract with events validates', () => {
  assert.ok(validate(example), JSON.stringify(validate.errors));
});

test('SCN-025: an event is a bare name or a record', () => {
  assert.ok(events(['onClick']));
  assert.ok(events([{ name: 'onOpenChange', description: 'Fires when the dialog opens or closes.' }]));
  assert.ok(events([{ name: 'onDismiss', deprecated: true, description: 'Use onOpenChange instead.' }]));
  assert.ok(events(['click', 'update:modelValue']), 'written the way usage code writes it, in any framework');
  assert.ok(events([]), 'says out loud that the component emits nothing');
  assert.ok(validate({ contractId: 'dialog', component: 'Dialog' }), 'events is optional');
});

test('SCN-025: an event carries no signature and no other member', () => {
  assert.ok(!events(['']), 'bare name is not empty');
  assert.ok(!events([{ description: 'No name' }]), 'record needs a name');
  assert.ok(!events([{ name: '' }]));
  assert.ok(!events([{ name: 'onClick', type: { text: '() => void' } }]), 'no signature');
  assert.ok(!events([{ name: 'onClick', tsType: '() => void' }]), 'no signature by another spelling');
  assert.ok(!events([{ name: 'onClick', deprecated: 'Use onPress.' }]), 'deprecated is boolean, as on a prop');
  assert.ok(!events(['onClick', 'onClick']), 'no duplicates');
  assert.ok(!events('onClick'));
});

test('SCN-025: a prop bag validates once a consumer sets declared events aside', () => {
  const validateProps = new Ajv2020({ strict: false }).compile(example.props);
  const names = example.events.map((e) => (typeof e === 'string' ? e : e.name));
  const usage = { open: true, onOpenChange: () => {}, onDismiss: () => {} };
  assert.ok(!validateProps(usage), 'a closed prop set alone flags a handler');
  const props = Object.fromEntries(Object.entries(usage).filter(([k]) => !names.includes(k)));
  assert.ok(validateProps(props), 'with events set aside, the same usage passes');
  assert.ok(!validateProps({ ...props, onClik: () => {} }), 'an undeclared handler still fails');
});
