// D-86: a manifest path stays inside the manifest's own directory.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';

const load = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(load('schemas/manifest.schema.json'));
const withPath = (path) =>
  validate({ contractVersion: '1', artifacts: [{ path, address: `sha256:${'a'.repeat(64)}`, origin: 'synced' }] });

for (const path of ['button.contract.json', 'components/button.contract.json', 'a/b/c.json', '.hidden/a.json', 'a..b.json', '%2e%2e/a.json']) {
  test(`SCN-023: accepts ${path}`, () => assert.ok(withPath(path)));
}

const rejected = {
  'parent directory': '../button.json',
  'parent directory, deep': 'a/../../button.json',
  'parent directory, trailing': 'a/..',
  'current directory': './button.json',
  'current directory, inner': 'a/./button.json',
  'absolute path': '/etc/passwd',
  URL: 'https://example.com/button.json',
  'protocol-relative URL': '//example.com/button.json',
  'file URL': 'file:///etc/passwd',
  'Windows drive': 'C:/button.json',
  'Windows separator': 'components\\button.json',
  'empty segment': 'a//b.json',
  'trailing slash': 'components/',
  'control character': 'a\u0000b.json',
};
for (const [name, path] of Object.entries(rejected)) {
  test(`SCN-023: rejects ${name}`, () => assert.ok(!withPath(path)));
}
