# Design System Contract

A design system's rules usually live where code tools can't read them: a docs site, a Figma
library, a component package's source. An AI coding agent working in a product repo weights the
code in front of it over rules it can't see. So it guesses at props, invents variant names, and
builds lookalike components.

The Design System Contract is a small, open JSON format that writes those rules down as data. There
is one file per component, saying which props exist, what type each one is, which values are legal,
and what the defaults are. A manifest lists the component files. Any tool can read the files, and
any JSON Schema validator can check them.

**Status: v0.1.** Two formats (the component contract and the manifest) and their JSON Schemas.
Licensed [Apache-2.0](LICENSE).

## A component contract

```json
{
  "$schema": "https://knapsack-labs.github.io/design-system-contract/schemas/v0/component.contract.schema.json",
  "contractId": "button-primary",
  "component": "Button Primary",
  "description": "The primary call-to-action button.",
  "props": {
    "properties": {
      "label":    { "type": "string", "description": "Visible text" },
      "variant":  { "type": "string", "enum": ["primary", "secondary"], "default": "primary" },
      "disabled": { "type": "boolean", "default": false }
    },
    "required": ["label"],
    "additionalProperties": false
  },
  "slots": ["icon", { "name": "body", "a11y": { "nameFrom": "content", "required": true } }],
  "states": ["hover", "disabled"]
}
```

- **`contractId`** is the component's identity. It is derived from the name the design system gives
  the component, by a fixed rule (below).
- **`component`** is the design system's own display name, kept exactly as written.
- **`props`** is itself a JSON Schema, so a tool can check a usage's props against it directly.
  Each prop has a `type` and may have a `default`, a `description`, and an `enum` of allowed values.
  `additionalProperties` says whether props not listed are allowed. A component with no `props`
  member takes no props.
- **Variants are enum props.** There is no separate variants block. A prop named `variant` with an
  `enum` is a variant axis, and so is `size`, `tone`, or anything else with an `enum`.
- **`slots`** and **`states`** are optional.
- **`cemRef`** and **`shadcnRef`** (optional) point at the same component's entry in a
  [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) or a
  [shadcn registry](https://ui.shadcn.com). They are identifiers only; the contract doesn't copy
  those entries.

## How `contractId` is derived

Take the component's declared name and:

1. Lowercase `A`–`Z`. Change no other character.
2. Replace every run of spaces, underscores, periods, and forward slashes with one hyphen.
3. Collapse repeated hyphens into one.
4. Trim hyphens from both ends.

| Declared name | `contractId` |
|---------------|--------------|
| `Button Primary`, `Button_Primary`, `Button.Primary` | `button-primary` |
| `forms/Button` | `forms-button` |
| `iconBadge` | `iconbadge` (case changes are not separators) |
| `Café` | rejected: `é` is left over and is never transliterated |
| `___` | rejected: nothing is left |

Two names that produce the same `contractId` in one manifest are a collision, and the publish fails.
Nothing is silently merged. The rule gives the same answer on every machine, in every locale.

## The manifest

```json
{
  "$schema": "https://knapsack-labs.github.io/design-system-contract/schemas/v0/manifest.schema.json",
  "contractVersion": "0.1.0",
  "artifacts": [
    {
      "path": "button-primary.contract.json",
      "address": "sha256:9a6ccffc92b47ab68c32e5c90aa85c5abaefb5ad89b604ebd9affd2b1f9315a4",
      "origin": "synced"
    }
  ]
}
```

Each record gives a contract's location relative to the manifest, its content address, and where it
came from: `synced` from the design system's source of truth, or `inferred` without the owner's
confirmation. The address is `sha256:` plus the SHA-256 digest of the contract serialized per
[RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) (JSON Canonicalization Scheme), so reformatting
a file doesn't change its address. Editing its content does.

## Using it with DSDS

The [Design System Documentation Specification](https://designsystemdocspec.org) (DSDS) describes
a design system's documentation. Its component entries carry a `specs` list that points at machine-
readable contracts. A DSDS component entry points at a Design System Contract like this:

```json
{
  "id": "button-primary",
  "specs": [
    { "href": "./contracts/button-primary.contract.json", "rel": "contract", "role": "Design System Contract" }
  ]
}
```

Every `contractId` is a valid DSDS `id`, and the two should match. The specification also maps
contract props and states onto DSDS `traits`: enum props become variant traits, boolean props become
boolean traits, and states become state traits.

## Checking files

The schemas are in [`schemas/`](schemas) and work with any JSON Schema 2020-12 validator. Nothing
else from this repository is needed. To run this repo's own checks against the schemas and
[examples](examples):

```sh
npm install
npm test
```

## What's here

| Path | What it is |
|------|------------|
| [`spec/spec.md`](spec/spec.md) | The normative specification: scenarios, requirements, and the decisions behind them |
| [`spec/constitution.md`](spec/constitution.md) | The principles every change to the format must respect |
| [`schemas/`](schemas) | JSON Schemas for the component contract and the manifest. Where prose and a schema disagree, the schema is correct. |
| [`examples/`](examples) | A valid contract and manifest |
| [`test/`](test) | Checks the schemas and examples against the specification |
| [`docs/future-directions.md`](docs/future-directions.md) | What v0.1 deliberately leaves out |

## Not in v0.1

Design tokens, strictness rules per destination, an agent-facing index, provenance and signing, and
a checker tool are all out of scope for this version. [Future directions](docs/future-directions.md)
says what each would add. None of it is a commitment.

## Known limitations

These are gaps in what v0.1 *does* cover. Each one is a candidate for a patch or minor release, and
each will be settled through the specification's change process rather than by the schema quietly
changing.

- **Some publish-time checks live only in the specification.** The spec says a publisher must fail
  when `required` names an undeclared prop, a `default` isn't one of its `enum` values, a name folds
  to nothing, or two names fold to the same `contractId`. JSON Schema can't express these, and v0.1
  ships no tool that runs them. A schema validator alone won't catch them.
- **The `contractId` fold has no executable test.** Its worked examples are in the specification,
  but nothing in `test/` runs them.
- **`enum` can be empty.** The schema accepts `"enum": []`, which describes a prop with no allowed
  values.
- **Prop names are unconstrained.** Any key is accepted under `props.properties`, including `""`.
- **`contractVersion` is free text.** It must be non-empty but doesn't have to be a semantic version.
- **`slots[].a11y.required` has no defined meaning yet.** It's a boolean in the schema, but the
  specification doesn't say what it requires.
- **The DSDS trait mapping has uncovered cases.** A name used as both a prop and a state (as
  `disabled` is in the example), a boolean prop that also carries `enum`, and a `type` array that
  includes `boolean` each have no single mapping.
- **The DSDS mapping was checked by hand** against DSDS 0.21.1. Nothing in this repository
  re-checks it when either format changes.

If one of these blocks you, open an issue. That's how we'll decide which to settle first.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). To report a security
issue, see [SECURITY.md](SECURITY.md).

## License

[Apache License 2.0](LICENSE). Anyone may implement the format, ship an implementation, redistribute
the specification, or fork it. No registration or vendor relationship is required. See
[NOTICE](NOTICE) for the prior art this work composes with.
