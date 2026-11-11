---
version: "0.12.0"
status: draft
last-amended: "2026-11-06"
amendments-pending: 0
mapping-pending: true
effort: contract-spec-wedge
---

# Specification — Design System Contract (format, v0.2 draft)

## Purpose

AI coding agents write UI at scale and weight nearby code over remote rules, so
they invent props, lookalike components, and values a design system already
governs. The **Design System Contract** is an open, Apache-2.0 format that puts
the governed interface of each component where agents and tools can read it: one
JSON file per component plus a manifest that lists them. A contract says what a
component is called, what props it takes and of what type, which of those are
required, what values an enumerated prop allows, and what slots and states it
exposes. Anyone may implement the format; no vendor relationship is required.

This version specifies the **format only**: two artifact classes, their JSON
Schemas, the rule that turns a declared component name into a stable identifier,
and the documented way a [DSDS](https://designsystemdocspec.org) component entry
points at a contract. Tooling that syncs, verifies, or scores against the format
is a separate concern and is listed under Future directions, not specified here.

## Scope

**In scope**

- The **component contract**: `contractId`, `component`, `description`, typed
  `props` expressed as JSON Schema 2020-12 (each optionally marked
  `deprecated`), optional `slots` (with rules on what fills them), `states`, and `events`, optional `exports` saying how
  code refers to the component, and optional `cemRef` / `shadcnRef` identifiers.
- The **manifest**: `contractVersion` and the list of component-contract
  artifacts with their paths, content addresses, and origin.
- The published **JSON Schemas** (Draft 2020-12) for both classes, validatable
  with any stock 2020-12 validator and no repository dependency.
- The **fold**: the normative rule deriving `contractId` from a declared name,
  its rejection classes, and collision handling.
- The **DSDS integration**: how a DSDS component entry references a contract, and
  how contract props and states map onto DSDS `traits`.
- The open licensing posture of the format and schemas.

**Out of scope** (explicit non-goals for v0.1)

- Design tokens (DTCG), tolerance envelopes, the agent index (`AGENTS.md`), the
  provenance log, signing and attestation, and any command-line tool or CI action.
  All deferred; see Future directions (D-70).
- How a publisher **extracts** slots and states from source (D-72).
- Per-source name rules for the fold beyond the stub in Appendix A.
- Cross-prop rules (which enum values may combine). DSDS `combos` is the prior
  art a later version composes with (D-80).
- The `authored` origin value (D-78) and any signature verification scheme.
- Collision detection against a previously published manifest (D-81).
- Any judgment-based or model-based evaluation of a contract or a usage.

---

## Behavioral scenarios (primary)

Actors: a **publisher** (the design-system team, or software acting for it, that
writes contracts and the manifest), a **consumer** (a developer, an AI coding
agent, or software that reads them), and a **stock validator** (any JSON Schema
2020-12 validator with no knowledge of this repository).

### SCN-010: Publisher writes a component contract that validates

**Given** a publisher has a component whose display name is `Button Primary` and
whose `contractId` is `button-primary`
**When** they write `button-primary.contract.json` carrying `contractId`,
`component`, and `description`, and validate it with a stock validator against
the published component-contract schema
**Then** the document validates, and a document carrying a root member the schema
does not declare fails validation at that member

**Acceptance criteria:**

- A document carrying only `contractId: "button-primary"` and
  `component: "Button Primary"` validates.
- Omitting `contractId` or `component` fails validation naming the missing member.
- `"component": ""` fails validation naming `component`; `component` is a
  non-empty string (D-81).
- `component` is carried verbatim; the contract validates although `component`
  and `contractId` differ (D-75).
- A root member outside `$schema`, `contractId`, `component`, `description`,
  `cemRef`, `shadcnRef`, `props`, `slots`, `states` fails validation with the
  offending member's location reported (`/variants` fails; D-73).
- `contractId: "Button_Primary"` and `contractId: "acme.button.v1"` fail the
  `contractId` pattern; `contractId: "button-primary"` passes.
- Validation runs with only the schema file and the stock validator; nothing else
  from this repository is required.

**Derived requirements:** SR-121, SR-122, SR-123, SR-103, SR-104
**Covered by:** mapping-pending (evals re-bound by `flow-eval` after release)

### SCN-011: Publisher declares typed props with required, default, and enum

**Given** a component that takes a `label` string that must be supplied, a
`variant` that is one of `primary` or `secondary` defaulting to `primary`, and a
`disabled` boolean defaulting to `false`
**When** the publisher writes `props` as a JSON Schema 2020-12 object schema with
`properties`, `required`, and `additionalProperties`
**Then** the contract validates and a consumer can read each prop's type,
whether it is required, its default, and its allowed values

**Acceptance criteria:**

- This fragment validates:
  ```json
  "props": {
    "properties": {
      "label":    { "type": "string", "description": "Visible text" },
      "variant":  { "type": "string", "enum": ["primary", "secondary"], "default": "primary" },
      "disabled": { "type": "boolean", "default": false }
    },
    "required": ["label"],
    "additionalProperties": false
  }
  ```
- `props` itself validates as a JSON Schema 2020-12 schema when handed to a stock
  validator's schema-compilation step, so a consumer can validate a prop bag
  against it directly and read the same openness the specification reads.
- The same fragment with `additionalProperties` omitted fails validation naming
  `additionalProperties` as a missing member (D-71).
- `"label": {}` fails validation naming `type`; every prop entry carries `type`
  (D-81).
- A per-prop member outside `type`, `default`, `description`, `enum` fails
  validation at that member (`"minimum": 0` fails in v0.1).
- `type` outside the 2020-12 type names (`string`, `number`, `integer`,
  `boolean`, `array`, `object`, `null`), or an array of them, fails validation.
- `required: ["size"]` where `size` is not a key of `properties` is a hard
  failure at publish naming `size`; the schema alone cannot detect it.
- `enum: ["primary", "secondary"]` with `default: "tertiary"` is a hard failure
  at publish naming `variant`.
- A contract with both findings above reports both in one failure; the publish
  does not stop at the first (D-81).
- A prop may be named `variant`; there is no separate `variants` member (D-73).

**Derived requirements:** SR-124, SR-125, SR-126, SR-127, SR-128
**Covered by:** mapping-pending

### SCN-012: Contract with no props declares an empty, closed set

**Given** a component that takes no props
**When** the publisher omits `props`, or writes
`props: { "additionalProperties": false }`, or writes
`props: { "properties": {}, "additionalProperties": false }`
**Then** the contract validates and a consumer treats the component as declaring
an empty prop set that is closed

**Acceptance criteria:**

- All three forms validate; the schema does not require `props`.
- All three forms are read identically: zero declared props, closed.
- `props: {}` and `props: { "properties": {} }` fail validation naming
  `additionalProperties` as missing: whenever `props` is present the flag is
  explicit, so a stock validator and this specification read the same openness
  (D-71). Only the absent-`props` form carries an implied value.
- `props: { "additionalProperties": true }` is read as zero declared props, open.

**Derived requirements:** SR-048
**Covered by:** mapping-pending

### SCN-013: Publisher declares slots and states, or leaves them out

**Given** a component with an `icon` slot, a `body` slot that must carry an
accessible name, and `hover` and `disabled` states
**When** the publisher writes `slots` and `states`
**Then** the contract validates, and a contract that omits both also validates

**Acceptance criteria:**

- `"slots": ["icon", { "name": "body", "a11y": { "nameFrom": "content", "required": true } }]`
  validates; a slot is a bare name or a record with `name` required and
  `description` and `a11y` optional.
- `"states": ["hover", "disabled"]` validates; each state is a non-empty string.
- A contract with neither member validates.
- A slot record with a member outside `name`, `description`, `a11y` fails
  validation at that member.
- Nothing in this specification says how the publisher obtained the slot and
  state names (D-72).

**Derived requirements:** SR-129
**Covered by:** mapping-pending

### SCN-014: Declared name folds to a DSDS-valid `contractId`

**Given** a publisher has a component declared in source as `Button_Primary`
**When** they derive `contractId` by the fold in the section "The fold"
**Then** `contractId` is `button-primary`, matches the schema pattern, and is a
valid DSDS component `id`

**Acceptance criteria:**

- Each row holds: `Button_Primary` → `button-primary`; `Button Primary` →
  `button-primary`; `iconBadge` → `iconbadge`; `ICON` → `icon`; `forms/Button`
  → `forms-button`; `Button--primary` → `button-primary`; `card-_header` →
  `card-header`; `Button.Primary` → `button-primary`.
- The result is identical on every host regardless of locale and Unicode version.
- The result is not truncated; a 300-character declared name of ASCII letters
  folds to a 300-character identifier.
- Every fold result matches `^[a-z0-9]+(-[a-z0-9]+)*$`, which is a subset of the
  DSDS `id` pattern `^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*$`.

**Derived requirements:** SR-130, SR-122
**Covered by:** mapping-pending

### SCN-015: Fold rejects unusable names and refuses to merge collisions

**Given** a publish assembling one manifest from two sources — a Custom Elements
Manifest declaring `Café`, `___`, and `Button Primary`, and a React source
declaring `button_primary` and `Button--Primary`
**When** the publisher folds every declared name contributing to the manifest
**Then** `Café` is rejected as carrying a residual character, `___` is rejected
as empty after fold, the three remaining names are reported as one collision on
`button-primary`, and all findings are reported in one failure of the publish

**Acceptance criteria:**

- `Café` → rejected with reason `carries residual character`; the output names
  `é`. No transliteration to `cafe`, no stripping, no decomposition.
- `___` and `/` and ` ` → rejected with reason `empty after fold`.
- `Button Primary`, `button_primary`, and `Button--Primary` all fold to
  `button-primary`; the publish fails with **one** collision report for that
  identifier naming all three declared names. No contract is written for any of
  them.
- Collision detection spans both sources: a name from the CEM and a name from
  the React source collide exactly as two names from one file would (D-81).
- The two rejections and the one collision appear together in one failure
  result; the publisher does not stop at the first finding (D-81).
- A previously published manifest is not consulted; a `contractId` that existed
  in last month's manifest and is absent from this one is not a collision (D-81).
- A rejection or collision is a hard failure: exit or result non-success, no
  partial manifest.

**Derived requirements:** SR-131, SR-132, SR-133
**Covered by:** mapping-pending

### SCN-016: Publisher writes a manifest that lists component contracts

**Given** two contracts on disk, `components/button-primary.contract.json` and
`components/card.contract.json`
**When** the publisher writes `manifest.json` with `$schema`, `contractVersion`,
and one `artifacts` record per contract carrying `path`, `address`, and `origin`
**Then** the manifest validates and each listed artifact can be located and
integrity-checked from the manifest alone

**Acceptance criteria:**

- This document validates:
  ```json
  {
    "$schema": "https://knapsack-oss.github.io/design-system-contract/schemas/v0.2/manifest.schema.json",
    "contractVersion": "3.2.0",
    "artifacts": [
      { "path": "components/button-primary.contract.json",
        "address": "sha256:<64 hex>", "origin": "synced" },
      { "path": "components/card.contract.json",
        "address": "sha256:<64 hex>", "origin": "inferred" }
    ]
  }
  ```
- `signer`, `signature`, `syncTimestamp`, or `sourceSystemVersion` at the root
  fails validation as an undeclared member (D-77).
- `origin: "authored"` fails validation (D-78); `inferred` and `synced` pass.
- Each `path` resolves relative to the manifest's own directory to a file that
  validates as a component contract.
- Each `address` equals `sha256:` plus the hex digest of the contract file's
  canonical form (glossary); an address that does not match marks that artifact
  invalid.
- A record with a member outside `path`, `address`, `origin` fails validation.
- Every `contractId` among the listed contracts is unique within the manifest;
  two contracts sharing one is the collision SR-133 fails at publish. The
  schema alone cannot detect it (D-81).
- The manifest never lists itself.

**Derived requirements:** SR-134, SR-135, SR-006, SR-136, SR-137, SR-133
**Covered by:** mapping-pending

### SCN-017: DSDS component entry points at a contract

**Given** a DSDS document with a component entry whose `id` is `button-primary`,
and a contract with `contractId: "button-primary"`
**When** the entry lists
`specs: [{ "href": "./contracts/button-primary.contract.json", "rel": "contract", "role": "Design System Contract" }]`
**Then** the DSDS document validates against DSDS's own schema, and a consumer
following `href` reaches a contract whose `contractId` equals the entry's `id`

**Acceptance criteria:**

- The DSDS document validates with DSDS's published validator unchanged; DSDS
  does not parse the target.
- `href` is a relative path or a URI; `rel` is `contract`; `role` is the string
  `Design System Contract`.
- One `specs` entry per component per format: a component published in two
  contract formats has two entries, each with its own `role`.
- `contractId` equals the DSDS `id`. Where a publisher chooses otherwise, that
  is permitted but discouraged (SHOULD, D-79).

**Derived requirements:** SR-138
**Covered by:** mapping-pending

### SCN-018: Consumer projects a contract onto DSDS traits

**Given** the contract from SCN-011 plus `states: ["hover"]`
**When** a consumer projects it onto a DSDS component entry's `traits`
**Then** the projection follows the mapping table in "DSDS mapping"

**Acceptance criteria:**

- `variant` (enum, default `primary`) → a trait named `variant` with
  `traitType: variant`, `kind: enum`, `values: ["primary", "secondary"]` — the
  default first, remaining values in declared order.
- An enum prop with `default: "secondary"` → `values: ["secondary", "primary"]`.
- An enum prop with no `default` → values in declared order, and the consumer
  records that DSDS will read the first value as the default.
- `disabled` (boolean) → a trait `disabled` with `kind: boolean`,
  `traitType: variant`.
- `hover` in `states` → a trait `hover` with `traitType: state`, `kind: boolean`.
- `label` (string, no enum) → no trait; DSDS traits carry no free-form props.

**Derived requirements:** SR-139, SR-140, SR-141
**Covered by:** mapping-pending

### SCN-019: Publisher marks a prop as deprecated

**Given** a `Chip` whose `dense` prop still works but has been replaced by
`size: sm`, and whose `tone` enum prop is being retired in favor of `variant`
**When** the publisher writes `"deprecated": true` on both props
**Then** the contract validates, a consumer can tell a deprecated prop from an
undeclared one, and the prop block stays a usable JSON Schema

**Acceptance criteria:**

- A prop's `deprecated` validates as a boolean; a string fails at that prop's
  `deprecated`. The prop block still compiles with a stock 2020-12 validator,
  which reads `deprecated` as its own annotation.
- A contract with no `deprecated` validates, and means no prop is deprecated.
- A deprecated prop is still declared: a usage that supplies it is a usage of a
  declared prop that is deprecated, not of an undeclared one.
- A consumer projecting onto DSDS gives the `tone` trait (an enum prop) a
  `deprecated` status. `dense` (a boolean prop) becomes a trait the same way.
  A deprecated prop of any other type has no trait and stays in the contract.
- The contract has no component-level deprecation. A deprecated component is
  recorded on its DSDS component entry's `metadata.status`.
- A deprecated value inside an `enum` is not expressible in this version.

**Derived requirements:** SR-125, SR-144, SR-145
### SCN-020: Publisher says how code refers to a component

**Given** a component declared as `IconBadge`, displayed as `Icon Badge`,
importable from `@acme/ui` and from `@acme/ui/icon-badge` (as its default
export), and also re-exported from `@acme/ui` as `StatusBadge`
**When** the publisher writes one `exports` record per way code refers to it
**Then** the contract validates, its `contractId` is `iconbadge` (the fold of the
declared name, Appendix A), and a consumer binds each of these usages to it by
exact key, with no guessing from names:
`import { IconBadge } from '@acme/ui'`,
`import { IconBadge as Badge } from '@acme/ui'`,
`import Badge from '@acme/ui/icon-badge'`, and
`import { StatusBadge } from '@acme/ui'`

**Acceptance criteria:**

- `exports` is optional; a contract without it validates and cannot be bound
  to code by this mechanism.
- Each record carries a `kind`. This version defines three: `js`
  (`name`, `specifier`), `custom-element` (`tagName`), and `angular-selector`
  (`selector`). A record of any other kind, or with a member outside its kind's
  members, fails validation.
- One contract may carry several records and several kinds: an Angular
  component carries its `js` import and its `angular-selector`; a custom
  element carries its `js` module and its `custom-element` tag.
- A `js` record names one exact module specifier. A component importable from
  a package root and from a subpath has one record for each. A default export
  is `name: "default"`; `name: "*"` fails.
- A local alias in the consuming file does not change the key: the imported
  export name is matched, not the local name.
- Two contracts in one manifest carrying the same key fail the publish.

**Derived requirements:** SR-147, SR-148, SR-149, SR-150, SR-151
**Covered by:** mapping-pending

### SCN-021: A consumer picks the schema a document names

**Given** one contract written against the v0.1 schema and one written against
v0.2, each naming its schema in `$schema`
**When** a consumer validates both
**Then** each validates against the schema it names, and a published schema has
not changed since its release

**Acceptance criteria:**

- Each format version has its own schema `$id`: `schemas/v0/` is v0.1 and
  `schemas/v0.2/` is v0.2. The bytes at a released `$id` never change.
- `contractVersion` does not select a schema. It is the version of the design
  system's published contract set.
- `$schema` stays optional. A consumer reading a document without it validates
  against the newest version it holds.
- `x-acme` at any closed object fails validation. A fact the format covers is
  written in its member; a fact it does not cover waits for a decision entry.
- `props` with `patternProperties` fails validation. A DOM attribute a
  component governs is declared like any other prop, by its full name.

**Derived requirements:** SR-152, SR-153, SR-154
### SCN-022: Publisher states what may fill a slot

**Given** a `Card` whose `body` must be filled, whose `media` takes at most one
component and no text, and whose `actions` take at most two primary buttons and
no text
**When** the publisher writes those rules on the slot records
**Then** the contract validates, and a consumer can read each rule without
consulting any other file

**Acceptance criteria:**

- `"minChildren": 1` means a usage must fill the slot; absent means 0.
- `"maxChildren": 1` means at most one child; absent means no limit; `0` fails
  validation. A run of text counts as one child.
- `"accepts": ["button-primary"]` means no other component may fill the slot;
  absent means any component; `[]` means no component. Entries match the
  `contractId` pattern and are unique.
- `"allowsText": false` means text may not fill the slot; absent means `true`.
- `"accepts": []` with `"allowsText": false` fails validation.
- `minChildren: 2` with `maxChildren: 1` is a hard failure at publish naming the
  slot; the schema alone cannot detect it.
- An `accepts` entry that is no `contractId` in the manifest is a hard failure at
  publish naming the slot and the entry.
- `a11y.required` means the slot's content must give the component an accessible
  name. It does not mean the slot must be filled.
- A bare slot name states no rule.

**Derived requirements:** SR-129, SR-155, SR-156, SR-157
**Covered by:** mapping-pending

### SCN-023: A manifest cannot point outside its own directory

**Given** a manifest received from a source a consumer does not control
**When** a record's `path` is `../../etc/passwd`, `/etc/passwd`, or
`https://example.com/x.json`
**Then** the manifest fails validation at that `path`, so no consumer following
the manifest reads outside the manifest's directory or reaches the network

**Acceptance criteria:**

- `components/button.contract.json` and `button.contract.json` pass.
- A path with a `.` or `..` segment, a leading slash, an empty segment, a trailing
  slash, a colon, a backslash, or a control character fails.
- A consumer uses `path` as written. `%2e%2e/a.json` passes validation and names
  a directory literally called `%2e%2e`.

**Derived requirements:** SR-158, SR-159
**Covered by:** mapping-pending

### SCN-024: A prop's values must fit its type

**Given** a prop declared `{ "type": "boolean", "default": "yes" }`, or
`{ "type": "boolean", "enum": ["a"] }`
**When** a publisher or consumer validates the contract with a stock validator
**Then** it fails validation at that prop, with no tool beyond the schema

**Acceptance criteria:**

- A `default` and every `enum` value must fit `type`. With an array of types, a
  value must fit at least one of them.
- `integer` accepts `2` and `2.0` and rejects `1.5`. `number` accepts all three.
- `"enum": []` and `"enum": ["a", "a"]` fail validation.
- A prop named `""` fails validation.
- Whether `default` is one of the `enum` values stays a publish-time check
  (SR-127): a stock schema cannot compare one value against another.

**Derived requirements:** SR-160
**Covered by:** mapping-pending

### SCN-025: Publisher names the events a component emits

**Given** a closed `Dialog` whose usages pass `onOpenChange` and a retired
`onDismiss` handler
**When** the publisher lists both in `events`
**Then** the contract validates, a consumer treats a usage of either as declared,
and an undeclared handler such as `onClik` is still flagged

**Acceptance criteria:**

- `events` is optional. An entry is a bare non-empty name or a record with `name`
  required and `description` and `deprecated` optional.
- A name is written the way usage code writes it: `onClick` in React, `click` for
  a custom element, `update:modelValue` in Vue, an output's name in Angular.
- A record with a member outside those three fails validation, including any
  signature (`type`, `tsType`). The source language's compiler checks signatures.
- `deprecated` is a boolean with the same meaning as on a prop (SR-144).
- A name present in both `props.properties` and `events`, or twice in `events` in
  different forms, is a hard failure at publish naming it.
- A consumer validating a prop bag against `props` sets declared events aside
  first; `props` itself holds only JSON values.
- An event has no DSDS trait.

**Derived requirements:** SR-161, SR-162, SR-163
**Covered by:** mapping-pending

---

## The fold (normative)

The fold derives `contractId` from a **declared name**: the name a publisher's
source gives the component. Given the declared name as a sequence of Unicode
code points:

1. Lowercase the ASCII letters `A` to `Z` only. Apply no other case mapping and
   no Unicode normalization, before, during, or after. The result must not depend
   on the host's locale or Unicode version.
2. Replace every run of one or more characters from the set {space, underscore,
   period, forward slash} with a single hyphen. That four-character set is the
   entire separator class.
3. Collapse every run of two or more hyphens to a single hyphen (D-79).
4. Remove leading and trailing hyphens.
5. Change nothing else. Do not truncate; do not impose a maximum length.

Classify the result:

- empty → rejected, reason `empty after fold`;
- any character outside `a`–`z`, `0`–`9`, hyphen → rejected, reason
  `carries residual character`. Never transliterate, strip, or decompose;
- otherwise the result is the identifier.

The fold does not Unicode-normalize and does not hyphenate at case boundaries
(`iconBadge` → `iconbadge`). `contractId` is unique within a manifest: two or
more declared names contributing to one manifest, whatever their source kind,
that fold to the same identifier are a **collision** and a hard failure at
publish, never a silent merge. A publish reports every rejection and every
collision together, one collision report per identifier, rather than stopping
at the first finding; it does not consult previously published manifests
(D-81). Per-source rules for what counts as the declared name live in
Appendix A.

---

## DSDS mapping (normative for projection)

| Contract | DSDS `traits` entry | Note |
|---|---|---|
| prop with `enum` | `traitType: variant`, `kind: enum`, `values` = `default` first then remaining `enum` values in declared order | DSDS reads the first value as default; without a `default` the first declared value takes that role |
| prop with `type: boolean` | `traitType: variant`, `kind: boolean` | |
| entry in `states` | `traitType: state`, `kind: boolean` | a state is present or absent |
| prop with any other type | no trait | DSDS traits do not model free-form props; the contract is the record |
| entry in `events` | no trait | DSDS traits do not model events; the contract is the record (D-88) |
| cross-prop rules | not in v0.1 | DSDS `combos` is the prior art for v0.2, ahead of cva `compoundVariants` (D-80) |
| prop with `deprecated: true` | the prop's trait, if it has one, gets status `deprecated`; `description` becomes `deprecationNotice` | a deprecated prop with no trait stays in the contract only. DSDS requires a notice on a deprecated status; a prop with no `description` gives the consumer none to carry, and the consumer records that (D-82) |

The trait's name is the prop or state name, unchanged.

---

## Requirements (derived)

Each requirement names its subject: **the schema** (the published JSON Schema
files), **a publisher**, or **a consumer**. New requirements number from SR-121;
retained requirements keep their IDs. The former split of non-functional
requirements at SR-100 is retired for new IDs; non-functional requirements are
tagged in the trailing comment.

### Functional requirements

- SR-121: The schema shall require `contractId` and `component` in a component contract, shall constrain `component` to a non-empty string (`minLength: 1`), and shall accept a document carrying only those two members.   # ← SCN-010 · amended v0.11.0 (D-81)
- SR-122: The schema shall constrain `contractId` to the pattern `^[a-z0-9]+(-[a-z0-9]+)*$`.   # ← SCN-010, SCN-014 (D-75, D-79)
- SR-123: A publisher shall carry `component` as the design system's own display name, verbatim, and shall not fold it, derive it from `contractId`, or require it to equal `contractId`.   # ← SCN-010 (D-75)
- SR-124: The schema shall express `props` as a JSON Schema 2020-12 object schema whose permitted members are exactly `properties`, `required`, and `additionalProperties`, with `additionalProperties` a required boolean whenever `props` is present.   # ← SCN-011, SCN-012 (D-71)
- SR-125: The schema shall require `type` in each `props.properties` entry and shall permit exactly the members `type`, `default`, `description`, `enum`, and `deprecated`, with `type` restricted to the 2020-12 type names or an array of them and `deprecated` a boolean.   # ← SCN-011, SCN-019 (D-71) · amended v0.11.0 (D-81) · amended (D-82)
- SR-126: If `props.required` names a prop that is not a key of `props.properties`, then a publisher shall fail the publish naming that prop, reporting it together with every other publish-time finding rather than stopping at the first.   # ← SCN-011 · amended v0.11.0 (D-81)
- SR-127: If a prop carries both `enum` and `default` and the default is not one of the enum values, then a publisher shall fail the publish naming that prop, reporting it together with every other publish-time finding rather than stopping at the first.   # ← SCN-011 · amended v0.11.0 (D-81)
- SR-128: The schema shall declare no `variants` member; a prop of any name, including `variant`, whose schema carries `enum` is a variant axis.   # ← SCN-011 (D-73)
- SR-048: If a component contract omits `props`, then a consumer shall treat the component as declaring an empty prop set that is closed; if `props` is present and omits `props.properties` or declares it as an empty object, then a consumer shall treat the component as declaring an empty prop set whose openness is `props.additionalProperties`; and the schema shall not require `props`.   # ← SCN-012 · retained; amended v0.10.0 (D-71)
- SR-129: The schema shall define `slots` as an optional array whose items are a non-empty string or a record with required `name` and optional `description` and `a11y`, and `states` as an optional array of non-empty strings.   # ← SCN-013 (D-72)
- SR-130: When a publisher derives `contractId` from a declared name, the publisher shall apply the five fold steps in order and classify the result as the section "The fold" specifies.   # ← SCN-014 (D-75, D-79)
- SR-131: If the fold result is empty, then a publisher shall reject the declared name with reason `empty after fold`, reporting it together with every other rejection and collision rather than stopping at the first.   # ← SCN-015 · amended v0.11.0 (D-81)
- SR-132: If the fold result contains a character outside `a`–`z`, `0`–`9`, and hyphen, then a publisher shall reject the declared name with reason `carries residual character`, shall not transliterate, strip, or decompose the character, and shall report the rejection together with every other rejection and collision rather than stopping at the first.   # ← SCN-015 · amended v0.11.0 (D-81)
- SR-133: If two or more declared names contributing to one manifest, whatever their source kind, fold to the same identifier, then a publisher shall fail the publish with one collision report for that identifier naming it and every declared name that folded to it, reported together with every other rejection and collision rather than stopping at the first, and shall write no contract for any of them.   # ← SCN-015, SCN-016 · amended v0.11.0 (D-81)
- SR-134: The schema shall require `contractVersion` and `artifacts` in a manifest, shall permit `$schema`, and shall declare no other root member.   # ← SCN-016 (D-77)
- SR-135: The schema shall require `path`, `address`, and `origin` in each manifest artifact record, shall declare no other member, and shall constrain `origin` to `inferred` or `synced`.   # ← SCN-016 (D-77, D-78)
- SR-006: The system shall address every contract artifact as `sha256:<hex>` of that artifact's canonical form.   # ← SCN-016 · retained unchanged
- SR-136: A publisher shall list in `artifacts` only component contracts, each `path` relative to the manifest's own directory, and shall never list the manifest itself.   # ← SCN-016 (D-70, D-77)
- SR-137: If an artifact's recomputed content address does not equal its recorded `address`, then a consumer shall treat that artifact as invalid and shall not report it as conforming.   # ← SCN-016 (INV-5)
- SR-138: Where a DSDS component entry references a contract, a publisher shall write one `specs` entry per component per format carrying `href` that resolves to the contract file, `rel` equal to `contract`, and `role` equal to `Design System Contract`.   # ← SCN-017 (D-76)
- SR-139: When a consumer projects a prop carrying `enum` onto DSDS traits, the consumer shall emit a trait of that prop's name with `traitType: variant`, `kind: enum`, and `values` ordered default-first then declared order.   # ← SCN-018 (D-80)
- SR-140: When a consumer projects a prop of `type: boolean` onto DSDS traits, the consumer shall emit a trait of that prop's name with `traitType: variant` and `kind: boolean`.   # ← SCN-018 (D-80)
- SR-141: When a consumer projects `states` onto DSDS traits, the consumer shall emit for each state a trait of that name with `traitType: state` and `kind: boolean`.   # ← SCN-018 (D-80)
- SR-144: Where a prop's `deprecated` is `true`, a consumer shall treat that prop as declared and deprecated; where `deprecated` is absent or `false`, the consumer shall treat it as not deprecated.   # ← SCN-019 (D-82)
- SR-145: When a consumer projects a deprecated prop onto a DSDS trait under SR-139 or SR-140, the consumer shall give that trait the status `deprecated`, carrying the prop's `description`, if any, as the trait's `deprecationNotice`.   # ← SCN-019 (D-82)
- SR-154: A publisher should write `props.additionalProperties` as `false`. Where a publisher writes `true`, it should say why in the contract's `description`, and a consumer shall not report an undeclared prop on that contract as a violation.   # ← SCN-021 (D-84)
- SR-147: The schema shall permit an optional root `exports` array of at least one unique record, each record a `js`, `custom-element`, or `angular-selector` record with exactly the members Appendix B gives that kind, and shall reject a record of any other kind.   # ← SCN-020 (D-83)
- SR-148: Where a component contract carries `exports`, a consumer shall bind a usage to that contract only when the usage's key equals a record's key under the matching rule Appendix B gives that record's kind, and shall not bind by `component` or `contractId` alone.   # ← SCN-020 (D-83)
- SR-149: If two or more contracts contributing to one manifest carry the same key, then a publisher shall fail the publish naming the key and every contract that carries it, reported together with every other publish-time finding rather than stopping at the first.   # ← SCN-020 (D-83, D-81)
- SR-150: When a publisher derives `contractId` from an npm package, the publisher shall fold the component's declared name as Appendix A's npm profile defines it, and shall not derive it from any `exports` record.   # ← SCN-020 (D-83)
- SR-151: A consumer shall keep apart a usage that resolves to a configured design system's module but matches no record (unbound) and a usage that resolves to a module outside every configured design system (outside the system), and shall report the first with the reason it did not bind.   # ← SCN-020 (D-83)
- SR-155: The schema shall permit on a slot record the optional members `minChildren` (an integer of at least 0), `maxChildren` (an integer of at least 1), `accepts` (unique strings matching the `contractId` pattern), and `allowsText` (a boolean), and shall reject a record whose `accepts` is empty and whose `allowsText` is `false`.   # ← SCN-022 (D-85)
- SR-156: If a slot's `minChildren` exceeds its `maxChildren`, or a slot's `accepts` names a `contractId` absent from the manifest, then a publisher shall fail the publish naming the slot, reporting it together with every other publish-time finding rather than stopping at the first.   # ← SCN-022 (D-85, D-81)
- SR-157: A consumer shall read a slot's absent `minChildren` as 0, absent `maxChildren` as no limit, absent `accepts` as any component, absent `allowsText` as `true`, and `a11y.required` as requiring the slot's content to give the component an accessible name.   # ← SCN-022 (D-85)
- SR-158: The schema shall constrain each artifact record's `path` to one or more forward-slash-separated segments, none of them `.` or `..`, and none containing a backslash, a colon, or a control character.   # ← SCN-023 (D-86)
- SR-159: A consumer shall resolve `path` against the manifest's own directory as written, shall not percent-decode it, and shall not follow a symbolic link out of that directory.   # ← SCN-023 (D-86)
- SR-160: The schema shall reject a prop whose `default` or any `enum` value does not fit its `type`, a prop whose `enum` is empty or holds duplicates, and an empty prop name.   # ← SCN-024 (D-87)
- SR-161: The schema shall define `events` as an optional array of unique items, each a non-empty string or a record with required `name` and optional `description` and boolean `deprecated`, and shall declare no member for a signature.   # ← SCN-025 (D-88)
- SR-162: If a name appears in both `props.properties` and `events`, or more than once in `events`, then a publisher shall fail the publish naming it, reporting it together with every other publish-time finding rather than stopping at the first.   # ← SCN-025 (D-88, D-81)
- SR-163: A consumer shall treat a usage of a name in `events` as declared whether `props` is closed or open, shall set those names aside before validating a prop bag against `props`, and shall not report a signature finding from a contract.   # ← SCN-025 (D-88)

### Non-functional requirements

- SR-103: The system shall publish a JSON Schema (Draft 2020-12) for each of the two artifact classes — the manifest and the component contract — such that a stock 2020-12 validator with no dependency on this repository validates a conforming document and rejects a non-conforming one.   # ← non-functional, no SCN · retained; amended v0.10.0 (D-70, D-74)
- SR-104: The schema shall set `additionalProperties: false` on every fixed-shape object in both published schemas, exempting from key-space closure every identifier-keyed map — any object whose keys are identifiers this specification does not enumerate, `props.properties` among them.   # ← non-functional, no SCN · retained; amended v0.10.0
- SR-105: The system shall publish the Design System Contract specification and its JSON Schemas under Apache-2.0.   # ← non-functional, no SCN · retained unchanged
- SR-106: The system shall not describe the Design System Contract format as proprietary or as license-restricted in any published artifact.   # ← non-functional, no SCN · retained unchanged
- SR-107: The system shall reference DSDS, Custom Elements Manifest, shadcn-registry, and DTCG constructs by those specifications' own identifiers rather than redefining them in the contract format.   # ← non-functional, no SCN · retained; amended v0.10.0 (AGENTS.md removed with D-70)
- SR-108: Where a component contract carries `cemRef` or `shadcnRef`, a publisher shall carry the referenced entry's identifier only and shall not restate the entry's shape in the contract.   # ← non-functional, no SCN · retained; amended v0.10.0
- SR-142: While its inputs are unchanged, a mechanical check this specification names — schema validation, the fold, collision detection, address recomputation, and the publish-time prop checks — shall produce the identical result on repeated runs.   # ← non-functional, no SCN (INV-1)
- SR-152: The system shall publish each format version's schemas under a `$id` of their own and shall not change the bytes at a released `$id`.   # ← non-functional, SCN-021 (D-84)
- SR-153: The schema shall declare no extension member and no extension pattern: a member named `x-` anything, at any object SR-104 closes, fails validation.   # ← non-functional, SCN-021 (D-84)
- SR-143: The system shall perform every mechanical check this specification names without any model inference call and without any network request.   # ← non-functional, no SCN (INV-1, D-74)

---

## Traceability: scenario → requirement

| Scenario | Derived SR | Notes |
|---|---|---|
| SCN-010 | SR-121, SR-122, SR-123, SR-103, SR-104 | minimal valid document; `component` non-empty (D-81); identity is `contractId` alone (D-75); root closed (SR-104) |
| SCN-011 | SR-124, SR-125, SR-126, SR-127, SR-128 | props as JSON Schema (D-71); `additionalProperties` required whenever `props` is present; `type` required per prop (D-81); enum prop is the variant axis (D-73); SR-126/127 are publish-time checks the schema cannot express, collected into one failure (D-81) |
| SCN-012 | SR-048, SR-124 | absent `props` = empty closed; present `props` states its own openness, so a stock validator agrees with the spec (D-71) |
| SCN-013 | SR-129 | optional; extraction unspecified (D-72) |
| SCN-014 | SR-130, SR-122 | fold with the D-79 hyphen-collapse step; output is a subset of the DSDS `id` pattern |
| SCN-015 | SR-131, SR-132, SR-133 | two rejection classes and the collision rule; uniqueness scope is one manifest across every contributing source; collect-all reporting, one report per identifier group; prior manifests out of scope (D-81) |
| SCN-016 | SR-134, SR-135, SR-006, SR-136, SR-137, SR-133 | slim manifest (D-77); `authored` deferred (D-78); INV-5 in SR form; manifest-level `contractId` uniqueness is SR-133's obligation, not a separate SR (D-81) |
| SCN-017 | SR-138 | DSDS `specs` pointer (D-76); `contractId` SHOULD equal DSDS `id` is guidance, not an SR |
| SCN-018 | SR-139, SR-140, SR-141 | DSDS trait mapping (D-80) |
| SCN-019 | SR-125, SR-144, SR-145 | prop `deprecated` is JSON Schema's own boolean annotation; a trait's deprecated status is derived from it; component deprecation lives in DSDS only (D-82) |
| SCN-021 | SR-152, SR-153, SR-154 | a schema per version; no extension members; closed is the expected prop set (D-84) |
| SCN-020 | SR-147, SR-148, SR-149, SR-150, SR-151 | code binding by kind (Appendix B); exact keys; identity from the declared name, never from a binding (Appendix A); unbound kept apart from outside the system (D-83) |
| SCN-022 | SR-129, SR-155, SR-156, SR-157 | slot rules; one home per fact, so "required" is `minChildren: 1` (D-85) |
| SCN-023 | SR-158, SR-159 | `path` stays inside the manifest's directory; supports SR-143's no-network rule (D-86) |
| SCN-024 | SR-160 | value checks a stock validator can run; default-in-enum stays with SR-127 (D-87) |
| SCN-025 | SR-161, SR-162, SR-163 | events by name; signatures stay with the compiler; closed prop sets stop flagging handlers (D-88) |
| — | SR-103, SR-104 | schema validatability with stock tooling; key-space closure |
| — | SR-105, SR-106 | open licensing posture |
| — | SR-107, SR-108 | composition with prior art |
| — | SR-142, SR-143 | determinism and no-model-call posture of mechanical checks |

---

## Invariants

Statements that must hold across all valid implementations. Each requires a
dedicated grader, a real + adversarial dataset pair, and threshold 1.0
(mapping-pending in this version).

- **INV-1**: No model inference call occurs in any mechanical check against this format. Mechanical checks are deterministic; judgment belongs elsewhere.   *amended v0.10.0 — re-anchored from the deferred CLI's verify path to mechanical checks generally (D-70, D-74)*
- **INV-3**: The Design System Contract format is never framed as proprietary IP. The specification and its JSON Schemas remain permissively licensed and freely redistributable.   *unchanged*
- **INV-4**: The contract composes with DTCG, DSDS, CEM, the shadcn registry, and AGENTS.md; it never replaces, forks, or shadows their constructs.   *unchanged*
- **INV-5**: No artifact is treated as valid whose content address does not equal the `sha256` of its canonical form. Any mismatch is a hard failure, never a warning.   *amended v0.10.0 — derivation parenthetical removed (D-74)*

**Removed in v0.10.0:** INV-2 (DTCG token payload carried byte-verbatim). Tokens
are deferred (D-70); the invariant returns with them and its number is not
reused. INV IDs are not renumbered. No invariant text changed in v0.11.0.

---

## Conformance tests

The eval suite is not part of the public release. Every scenario, requirement,
and invariant in this version is `mapping-pending`; `flow-eval` re-binds them to
graders and datasets after release. Mechanical acceptance criteria above are
written so that each becomes one fixture: a document plus an expected
validate/reject or fold/reject result.

---

## Future directions (informative, not requirements)

Deferred from v0.1 by D-70 and D-77, in no particular order: DTCG tokens carried
byte-verbatim alongside the contracts; tolerance envelopes (strictness by
destination); a thin agent index (`AGENTS.md`); an append-only provenance log;
signing and attestation, including manifest-level and per-artifact `signer` /
`signature` slots, a per-artifact `ratified` state, and a `canonicalForm`
cache (D-77); the origin value `authored` (D-78); richer per-prop JSON Schema
keywords; deprecation of a single enum value (D-82); cross-prop rules composing with DSDS `combos`; collision detection
against previously published manifests (D-81); a deterministic checker that
never calls a model; and a CI action. None of these is specified here and none
is promised.

---

## Glossary

- **component contract** — one JSON document describing the governed interface
  of exactly one component: identity, display name, typed props, slots, states,
  and prior-art identifiers. Recommended filename `<contractId>.contract.json`.
- **contractId** — the contract's normative identity: the fold of its declared
  name, matching `^[a-z0-9]+(-[a-z0-9]+)*$`. Unique within a manifest (D-81).
  Not namespaced, not versioned; owner and version live outside the identifier
  (D-75).
- **component** — the design system's own display name for the component,
  carried verbatim as a non-empty string. May differ from `contractId` (D-75,
  D-81).
- **declared name** — the name a publisher's source gives a component; the input
  to the fold. What counts as the declared name per source kind is Appendix A.
- **export record** — one entry in `exports`: one way code refers to the
  component, as a `kind` plus that kind's key. A contract may carry several
  (D-83).
- **binding** — the link a consumer makes from a usage in code to the contract
  that governs it, by matching the usage's key against export records.
- **unbound** — a usage that resolves to a configured design system's module
  but matches no export record. Not the same as a usage from outside every
  configured design system (D-83).
- **fold** — the five-step derivation from declared name to `contractId`, with
  two rejection classes and collision as hard failure.
- **residual character** — a character remaining after the fold that is outside
  `a`–`z`, `0`–`9`, hyphen. Rejected, never transliterated.
- **collision** — two or more declared names contributing to one manifest,
  from any source kind, folding to one identifier. A hard failure at publish,
  reported once per identifier naming every colliding declared name, together
  with every other finding of the same publish. Previously published manifests
  are not consulted (D-81).
- **prop** — an entry in `props.properties`: a name plus a per-prop schema
  carrying a required `type` and optional `default`, `description`, `enum`
  (D-81).
- **variant axis** — a prop whose schema carries `enum`. There is no separate
  variants structure; a prop may be named `variant` (D-73).
- **closed / open prop set** — closed: a prop outside `properties` is
  undeclared. Open: any prop is permitted. Stated explicitly by
  `props.additionalProperties`, which is required whenever `props` is present;
  a contract with no `props` member is closed (D-71). Closed is the expected
  value and open is a deviation (D-84).
- **slot** — a named insertion point, as a bare name or a record with `name`,
  `description`, `a11y` (`role`, `nameFrom`, `required`), `minChildren`,
  `maxChildren`, `accepts`, and `allowsText` (D-85).
- **state** — a named condition the component can be in, as a non-empty string.
- **event** — something a component emits, named the way usage code writes it, as
  a bare name or a record with `name`, `description`, `deprecated`. Carries no
  signature (D-88).
- **deprecated prop** — still declared and still accepted, but new usages should
  not supply it. Marked with JSON Schema's boolean `deprecated` annotation.
  Removal is a separate event: a removed prop is undeclared. Component
  deprecation is not a contract concept; it is a DSDS entry status (D-82).
- **manifest** — `manifest.json`: `contractVersion` plus one artifact record per
  component contract.
- **artifact record** — `{ path, address, origin }`; `path` relative to the
  manifest's directory and never leaving it (D-86); `origin` is `inferred` (derived without owner
  confirmation) or `synced` (retrieved from the design system's source of truth).
- **content address** — `sha256:<hex>` of an artifact's canonical form.
- **canonical form** — the serialization of a JSON artifact over which its
  address is computed: parse the file as JSON, then serialize the value per
  **RFC 8785 (JSON Canonicalization Scheme)** as UTF-8 bytes — no whitespace,
  object members sorted by UTF-16 code units of their names, numbers in
  ECMAScript shortest round-trip form, strings with only the escapes RFC 8785
  requires, no trailing newline. Worked example: the file
  `{ "contractId": "button-primary", "component": "Button Primary" }` however
  it is indented canonicalizes to the 60 bytes
  `{"component":"Button Primary","contractId":"button-primary"}`, and its
  address is `sha256:` plus the hex digest of those bytes (D-77).
- **publish** — one run of a publisher that produces one manifest and its
  contracts from one or more sources. The unit over which collisions are
  detected and findings are collected (D-81).
- **publisher** — the design-system team, or software acting for it, that writes
  contracts and the manifest.
- **consumer** — a developer, an agent, or software that reads them.
- **mechanical check** — a check whose result is a function of its inputs and
  the published schemas alone: validation, fold, collision, address, publish-time
  prop checks. Never a model call.
- **stock validator** — any JSON Schema 2020-12 validator with no knowledge of
  this repository.
- **DSDS** — the Design System Documentation Specification. Its component entry
  `id`, `specs`, `traits`, and `combos` are referenced here by DSDS's own names.

---

## Appendix A — Derivation profiles (stub)

A derivation profile says, for one kind of source, what the declared name is:
which identifier the fold receives. v0.1 defines no profile. A publisher states
which source identifier it folds (for example a React export name, a Custom
Elements Manifest `tagName`, or a design-tool component name) in its own
documentation. A publisher SHOULD fold the same source identifier for a
component on every publish, so that a component's `contractId` is stable across
publishes (D-81). The fold itself does not change with the profile.

### Profile: npm package, component unit (D-83)

- **Unit:** one component declaration in the package's published type
  declarations, however many ways it is exported.
- **Declared name:** the declaration's own written name: its class or function
  name, exactly as written in the declaration file. Where a Custom Elements
  Manifest describes it, the manifest declaration's `name` (the class name).
- **Not read:** export names, including `default` and renamed exports; a
  custom element's `tagName`. These are export records (Appendix B), not
  identity.
- **Merging:** two exports of one declaration are one unit with two export
  records, never two contracts.
- **Rejection:** a declaration with no written name, such as an anonymous
  default export, is rejected as unnormalizable; the publisher names it.

---

## Appendix B — Export record kinds (D-83)

Each kind answers six questions, so two tools reading the same contract bind
the same usages. A new kind is added by answering the same six.

| Question | `js` | `custom-element` | `angular-selector` |
|---|---|---|---|
| Reference form: how usage code names the component | an import of a named or default export | a tag in HTML, JSX, or a template | an element or attribute in an Angular template |
| Key members | `name`, `specifier` | `tagName` | `selector` |
| Normalization | none; both compared exactly. A local alias is resolved to the imported name first | a usage's tag name is ASCII-lowercased, as HTML parsing does | none; the selector is used as written |
| Matching rule | the import's specifier equals `specifier` and its imported export name equals `name`; a namespace import's member access counts as importing that member | the lowercased tag equals `tagName` | Angular's own selector matching against the element |
| Scope | modules the consuming project depends on | the page's custom element registry; a tag names one element per page | components the template's module or standalone `imports` bring in |
| Prior-art name | the ECMAScript module specifier; the Custom Elements Manifest's export `name` | the Custom Elements Manifest's `tagName` | Angular's `selector` |

Considered for later kinds, not defined here: Swift (`name` plus `module`),
Svelte and Vue single-file components (covered by `js` when imported; Vue
global registration is name-based), and scoped custom element registries,
whose local tags a scanner resolves back to the `js` record.

---

## Resolved decisions

Earlier drafts and their decisions were internal; the public record starts at
v0.10.0 with D-70.

### D-70 – D-80 — the v0.1 release docket (2026-09-24)

All eleven were ruled by Robin on 2026-09-24 for the public v0.1 release.

- **D-70 — v0.1 artifact set is manifest plus component contracts.** *What:*
  two artifact classes. DTCG tokens, tolerance envelopes, the agent index,
  the provenance log, signing, the command-line tool (`init` / `sync` /
  `verify` / `score`), and the CI action are deferred and recorded under Future
  directions as directions, not requirements. SCN-001 – SCN-009 and every SR
  that served only the deferred surfaces are removed and their identifiers
  retired, never reused; INV-2 is removed with tokens. *Why:* the release is a
  format other parties can adopt; the tooling depends on artifacts that are cut,
  and shipping it half-scoped would publish behavior the spec no longer
  defines. *Cost:* the format alone cannot fail a build; the deterministic
  checker is a promise in prose until a later version.
- **D-71 — props are JSON Schema 2020-12.** *What:* `props` is an object schema
  permitting `properties`, `required`, `additionalProperties`; each prop
  permits `type`, `default`, `description`, `enum`. The former `declared` array
  does not survive; `properties` replaces it. **Openness is explicit:**
  whenever `props` is present, `props.additionalProperties` is a required
  boolean; a contract that omits `props` entirely declares an empty, closed
  set, and the schema does not require `props` (SR-048, SR-124). This
  supersedes the earlier internal rule that an absent flag implied closed.
  *Why:* typed props are what an agent needs to fill a prop bag correctly, and
  JSON Schema is the vocabulary every toolchain already has. An implied-closed
  default would invert JSON Schema's own meaning for an absent
  `additionalProperties`, so a stock validator handed the fragment would read
  it as open while this specification read it as closed; requiring the flag
  makes both read the same thing from the same bytes. *Cost, stated:* one
  extra required member per contract with props; the four-keyword per-prop set
  excludes `items`, `minimum`, `pattern`, `$ref` and the like in v0.1.
- **D-72 — slots and states are optional and schema-defined; extraction is
  unspecified.** *What:* both members optional; shapes per SR-129; no
  requirement on how a publisher finds them. *Why:* the shape is stable across
  frameworks, the extraction is not. *Cost:* two publishers may disagree on a
  component's slots without either being non-conforming.
- **D-73 — no separate `variants` block.** *What:* an enum-typed prop is the
  variant axis; a prop may be named `variant`; the schema declares no
  `variants` member. An earlier internal record had left open whether
  `variants` keys counted as declared props; with one structure there is no
  such question. *Why:* once props carry `enum`, a second enumeration is a second source
  of truth for the same fact; DSDS itself uses a trait named `variant` with no
  separate block. *Cost:* cva, Stitches, and Panda users lose a familiar key;
  cross-prop combination rules have no home until v0.2 (D-80).
- **D-74 — the published schema is the ground truth.** *What:* where prose and
  schema disagree, the schema is correct; a semantic schema change is recorded
  as a decision here before it lands. Internal repositories and earlier
  internal formats are no longer cited in this specification or the
  constitution; their divergence inventory stays internal. *Why:* a public
  reader can only be bound by what is published. *Cost:* the derivation
  history of some schema choices is no longer visible from the spec.
- **D-75 — `contractId` is the sole normative identity; `component` is not
  folded.** *What:* `contractId` = fold(declared name), for example
  `button-primary`; not namespaced, not versioned — the `acme.button.v1` form
  is retired and owner and version live in the manifest. `component` is the
  design system's own display name, verbatim, and may differ from
  `contractId`. *Tension cited:* the v0 schema glossed `component` as "name as
  rendered at a usage site", which read as a code identifier; identity and
  display name are now deliberately allowed to differ, so a future checker
  binds a usage to a contract by some other means, which is deferred with the
  checker. *Why:* one identity, mechanically derived, that violations and DSDS
  entries can both cite. *Cost:* a system whose display names collide after
  folding must rename or fail; per-platform variants of one component need a
  profile (Appendix A) rather than a suffix.
- **D-76 — DSDS `specs` is the documented integration.** *What:* a DSDS
  component entry lists `specs: [{ href, rel: "contract", role: "Design System
  Contract" }]`, one entry per component per format. *Why:* DSDS 0.20.0
  removed its own `api` block and left this pointer for any contract format;
  composing with it costs nothing and positions the two as complementary.
  *Cost:* none beyond one array entry.
- **D-77 — manifest slimmed.** *What:* root members `$schema`,
  `contractVersion`, `artifacts`; records `{ path, address, origin }`;
  `signer`, `signature`, `syncTimestamp`, `sourceSystemVersion`, per-record
  `signer` / `signature`, `ratified`, and the `canonicalForm` cache are
  removed and listed under Future directions; signing is deferred. `path` is
  relative to the manifest's own directory (equivalent to the former
  `.design-system/`-relative rule when the manifest sits there). **`address`
  is kept, over the canonical form, and the canonical form is now RFC 8785
  (JSON Canonicalization Scheme) over the parsed value, as UTF-8.** The
  earlier house rule (two-space indentation, keys sorted by code point, one
  trailing newline) was fully specified but differed from RFC 8785 in
  whitespace, trailing newline, and sort order for characters outside the
  Basic Multilingual Plane; the spec aligns to the RFC rather than carry a
  near-standard of its own. *Why:* every removed member was provenance or
  signing parity for a scheme this version does not define; an address over a
  published canonicalization is verifiable with off-the-shelf libraries.
  *Cost:* a v0.1 manifest cannot express ratification; addresses computed
  under the earlier house rule do not match and must be recomputed; a v0.2
  that adds signing adds members, which is additive.
- **D-78 — origin `authored` deferred to v0.2.** *What:* `origin` is `inferred`
  or `synced`. *Why:* `authored` (a human wrote the contract by hand) needs a
  provenance story to mean anything. *Cost:* a hand-written contract is
  recorded as `inferred` in v0.1.
- **D-79 — the fold collapses hyphen runs.** *What:* one added step after
  separator replacement and before trimming. Every fold result then matches
  the DSDS `id` pattern, and `contractId` SHOULD equal the DSDS component
  entry `id` when one exists. *Why:* hyphen is not in the separator class, so
  `Button--primary` and `card-_header` folded to double-hyphen identifiers
  DSDS rejects. *Cost:* two declared names differing only in hyphen count now
  collide; that is the intended outcome.
- **D-80 — DSDS mapping table published.** *What:* the table in "DSDS mapping":
  enum prop → `kind: enum, traitType: variant` with `default` moved first;
  boolean prop → `kind: boolean`; `states` → `traitType: state`; deferred
  cross-prop rules → DSDS `combos`, cited as prior art for v0.2 ahead of cva
  `compoundVariants`. *Why:* DSDS already models variants and states; a
  mapping composes, a rival vocabulary competes. *Cost:* an enum prop without
  `default` becomes a DSDS trait whose first value is read as default, a
  meaning the contract did not assert; the mapping says so.

### D-81 — the 2026-09-24 interpretation-panel amendments

Three independent readers were run blind over the typed-props and fold slice
of v0.10.0. They split on one reading and one reader each surfaced two latent
forks; the operator routed all of them, plus one noted ambiguity, as
amendments rather than accepting any as an ambiguity. Ruled by Robin on
2026-09-24; landed in v0.11.0.

- **D-81 — collision scope, collect-all reporting, required `type`, non-empty
  `component`, stable declared name.** *What, four parts.* **(1) P-1, panel
  split 1–2.** SR-133's "one source" is replaced: `contractId` is unique
  within a manifest, and collision detection covers every declared name
  contributing to that manifest whatever its source kind — one reader read
  "source" as one input file and checked collisions per file, two read it as
  one publish run; the two-reader reading is ruled, extended to say so in
  terms of the manifest. Previously published manifests are out of scope. A
  publish reports every rejection and every collision together, one collision
  report per identifier naming all N declared names, rather than stopping at
  the first finding; the same collect-all wording is applied to SR-126 and
  SR-127 (all three readers had independently chosen collect-all and
  per-identifier grouping, so this ratifies convergent behavior). Manifest-
  level uniqueness is SR-133's obligation, cross-referenced from SCN-016; no
  separate SR is added, because every `contractId` is a fold result (SR-130)
  and SR-133 already fails the publish that would produce a duplicate.
  **(2) P-2, single reader.** `type` is required in every `props.properties`
  entry (SR-125); `{}` is not a legal prop schema. Two readers' schemas would
  have accepted an untyped prop, which contradicts D-71's stated reason for
  the shape. **(3) P-3, single reader.** `component` is a non-empty string,
  `minLength: 1` (SR-121). One reader read "verbatim" as licensing the empty
  string. **(4) Appendix A.** A publisher SHOULD fold the same source
  identifier for a component on every publish, so `contractId` is stable
  across publishes; a recommendation, because profiles are v0.2 scope. *Why:*
  each fork would have produced two conforming implementations that disagree
  on whether the same input is valid — the exact non-interoperation the format
  exists to prevent — and every fix is a tightening a stock validator or a
  fixture can check. *Cost:* a publisher that merged several source kinds
  without cross-source collision checks must add one; a publisher emitting
  untyped props must type them; hand-written contracts with `"component": ""`
  become invalid; a consumer wanting collision detection against last month's
  manifest builds it outside this specification. No spelling pinned beyond
  members the schema already names; no invariant changed.


### D-82 — prop deprecation

- **D-82 — a prop can be marked deprecated; a component cannot.** *What:* an
  optional boolean `deprecated` on each prop (SR-125), meaning "declared, still
  accepted, stop using it" (SR-144). A deprecated enum or boolean prop's DSDS
  trait takes the status `deprecated`, derived from the contract (SR-145). The
  contract gains no component-level marker. *Prior art:* JSON Schema 2020-12
  defines `deprecated` as a boolean annotation in its meta-data vocabulary;
  because `props` is a JSON Schema, the marker is that keyword, unchanged, and a
  prop block stays compilable by any stock validator. The Custom Elements
  Manifest marks attributes and properties with `deprecated: boolean | string`
  and DTCG marks tokens with `$deprecated: boolean | string`; both confirm the
  name. DSDS models lifecycle as a `status` on entries, traits, and trait
  values, with a required `deprecationNotice` and an optional `replacedBy`.
  Southleft's `ds-contracts-poc`
  carries `status: draft | stable | deprecated` on a component; the same need is
  met here by DSDS, which already holds component lifecycle. The shadcn registry has no equivalent. *Why:* without it, a
  contract can say a prop is declared or not, but not "declared, being phased
  out". A tool reading the contract either keeps recommending the old prop or,
  if the prop is dropped, reports every working usage as invalid. *Why one
  home per fact:* a design system author who can mark the same thing deprecated
  in two files will, sooner or later, mark it in one and not the other, and
  every reader then has to decide which file wins. A component's lifecycle is
  already a DSDS entry status, so the contract does not restate it (INV-4). A
  prop's deprecation has no DSDS home unless the prop becomes a trait, and
  traits are already projected from the contract (D-80), so the contract is
  where it is written and the trait status follows from it. *Not included:* a
  reason string on a prop (JSON Schema's keyword is boolean, and a string would
  make the prop block an invalid JSON Schema; the reason goes in
  `description`); deprecating one value of an `enum`; a successor pointer, which
  DSDS offers as `replacedBy`. *Cost:* one optional prop member. The prop
  object is closed (SR-104), so a validator holding the v0.1 schema rejects a
  contract that uses it; publishers and consumers move to the schema that
  carries it together. A consumer that ignores the marker loses nothing it had
  before.
### D-83 — export records

- **D-83 — a contract can say how code refers to its component.** *What:* an
  optional root `exports` of typed records (SR-147), three kinds in this
  version (Appendix B). A consumer binds a usage only by exact key (SR-148); a
  publisher fails a publish where two contracts claim one key (SR-149). For an
  npm source, `contractId` comes from the declared name, never from an export
  record (SR-150, Appendix A). Unbound usages are kept apart from usages
  outside the system (SR-151). *Why:* D-75 separated identity from display
  name and deferred how a checker binds a usage to a contract. Without a
  binding, a tool that reads `<Button variant="hero">` cannot know which
  contract governs `Button`: the display name may differ, the fold loses case,
  two packages can each export a `Button`, templates name components by tag or
  selector, and one component is often exported under several names. Tools
  then match by name and are quietly wrong, or skip component checks.
  *Why keys, not names:* each record is the exact thing a usage carries, so
  matching is equality, and both precision and recall are measurable against
  labeled usages. *Why identity stays separate:* `contractId` must stay a
  lowercase DSDS-compatible id (D-75, D-79), and export names vary and can be
  reordered; deriving identity from the declaration gives one source however a
  component is exported. *Prior art:* the Custom Elements Manifest records
  exports by `name` and custom elements by `tagName`; ECMAScript calls the
  import string a module specifier; Angular calls its template key a
  `selector`. DSDS 0.23 puts `imports[{ platform, code, package }]` on a
  component entry; `code` is an import statement written for people, and
  there is no structured export name. Southleft's `ds-contracts-poc`
  pairs the same two facts in `bindings.code.anchors { importPath, export }`,
  one per contract, pointing at the component's source in the design system's
  repository; that links a contract to its own source. This proposal serves
  the other direction, tools reading product code, so it records the
  published specifiers that code imports and allows several records per
  contract. The two compose. *Not included:* Swift, Vue global
  names, and other kinds (Appendix B lists candidates); an extension point for
  unknown kinds (each new kind is a schema change until the format reaches
  1.0); a platform field (D-75). *Cost:* one optional member and a publish-time
  check. The root is closed (SR-104), so a validator holding the v0.1 schema
  rejects a contract that uses `exports`; publishers and consumers move to the
  schema that carries it together.

### D-84: how the format versions, and what stays closed

Proposed on 2026-11-06 by Chris Strahl for the maintainer's ruling. The merge
records the ruling.

- **D-84: a schema per format version, no extension members, closed props.**
  *What, three parts.* **(1) Versioning.** The schemas close every fixed-shape
  object (SR-104), so any new member makes the previous schema reject documents
  that use it. Each format version therefore gets its own `$id`, and a released
  `$id` never changes (SR-152). `schemas/v0/` stays frozen as v0.1; this change
  and those that follow it publish as `schemas/v0.2/`. A consumer selects by
  `$schema`. Selecting by `contractVersion` was considered and rejected: that
  member versions the design system's contract set, not the format. **(2) No
  extension members.** `x-` members stay invalid (SR-153). Where a publisher's
  tooling carries a fact the format has a member for, such as a slot, it writes
  that member. Where the format has none, the gap goes through this change
  process. **(3) Closed props.** `additionalProperties: true` stays legal but is
  named as a deviation (SR-154). `patternProperties` is rejected: a rule that
  opens a prop set by name pattern admits props nobody declared, and a closed
  set is the point of the format. *Why:* a contract's value is that a reader can
  trust it as the whole interface. *Prior art:* JSON Schema 2020-12 identifies a
  schema by `$id`, and defines `patternProperties`. OpenAPI has `x-` extensions
  and DTCG has `$extensions`; both were considered and not adopted, because an
  extension point lets each tool grow a private dialect of a format whose job is
  one reading. *Cost:* a component that spreads DOM attributes must declare each
  attribute it governs or be published as open, so those contracts are longer. A
  publisher holding a fact the format lacks cannot carry it in the contract until
  a decision entry adds it. A v0.1 document stays valid against `schemas/v0/`;
  adopting v0.2 changes its `$schema`, and so its content address.

### D-85: slot rules

Proposed on 2026-11-06 by Chris Strahl for the maintainer's ruling. The merge
records the ruling.

- **D-85: a slot can state how many children it takes and what they may be.**
  *What:* four optional members on a slot record: `minChildren`, `maxChildren`,
  `accepts`, and `allowsText` (SR-155). A publisher checks what the schema cannot
  (SR-156). `a11y.required`, which v0.1 left undefined, is defined as requiring an
  accessible name (SR-157). *Why:* experience with design system tooling shows
  the rules authors most want on a slot are that it must be filled, that it takes
  only one thing, that it takes no bare text, and that it takes only certain
  components. v0.1 rejected all four, so a contract could name a slot but not
  govern it. *Prior art:* Nathan Curtis's `@directededges/specs-schema` has
  `minChildren`, `maxChildren`, and an `anyOf` list with reserved `$text` and
  `$glyph` markers. Southleft's `ds-contracts-poc` has `required`, `min`, `max`,
  and `accepts`. The Custom Elements Manifest records only a slot's `name`,
  `summary`, `description`, and `deprecated`. DSDS has no slot field, and the
  shadcn registry and DTCG have no equivalent. This entry takes `minChildren` and
  `maxChildren` from the first and `accepts` from the second. It does not take a
  separate `required`, because `minChildren: 1` already says it and one fact gets
  one home (D-82). It does not take `anyOf`, because the name means something
  else in JSON Schema, or reserved markers, because a list that mixes identifiers
  and markers cannot say "any component but no text"; `allowsText` can. *Novel:*
  `allowsText` has no direct precedent and needs a person's decision under CC-5.
  *Not included:* a preference tier like `ds-contracts-poc`'s `acceptsMode`, since
  a contract states rules and not picker hints; glyph or image primitives. *Cost:*
  four optional members and two publish-time checks. `accepts` ties a contract to
  its manifest's other contracts, so a slot cannot name a component from another
  design system. Southleft measured its own corpus and found `min` and `max` used
  on none of 48 slots, so cardinality may see little use from generated contracts.

### D-86: manifest paths stay inside the manifest's directory

Proposed on 2026-11-06 by Chris Strahl for the maintainer's ruling. The merge
records the ruling.

- **D-86: `path` cannot leave the manifest's directory.** *What:* a schema pattern
  on `path` (SR-158) and a consumer rule for reading it (SR-159). *Why:* SR-136
  said `path` is relative, but the schema accepted `../../etc/passwd`, an absolute
  path, and a URL, and under D-74 the schema wins. A consumer following such a
  manifest could read outside the design system's files, or make the network
  request SR-143 forbids. A content address does not help, since the same manifest
  supplies it. *Prior art:* this adds no member, so PROH-4's check does not apply; RFC 3986
  names the dot segments. *Cost:* a publisher cannot list contracts stored above
  the manifest, and must move the manifest up instead. The pattern rejects a colon
  anywhere in a path, so a file name with a colon must be renamed. Symbolic links
  are invisible to a schema, so SR-159 leaves them to the consumer.

### D-87: prop values fit their type

Proposed on 2026-11-06 by Chris Strahl for the maintainer's ruling. The merge
records the ruling.

- **D-87: the schema checks `default` and `enum` against `type`.** *What:* seven
  conditional branches on the prop schema, plus `minItems` and `uniqueItems` on
  `enum` and a non-empty prop name (SR-160). *Why:* `{ "type": "boolean", "default":
  "yes" }` validated, so a consumer told by a contract to fill in that default
  would write a value of the wrong type. These checks fit in JSON Schema, so every
  stock validator runs them and no tool is needed. *Prior art:* this adds no member.
  JSON Schema 2020-12 recommends that a `default` be valid against its schema and
  that `enum` have at least one element and no duplicates; this entry makes those
  hard rules. *Cost:* existing contracts that break these rules become invalid under
  v0.2. A validator's error points into the `allOf` branch, not at a plain message
  about the prop. Default-in-enum stays a publish-time check.

### D-88: events by name

Proposed on 2026-11-06 by Chris Strahl for the maintainer's ruling. The merge
records the ruling.

- **D-88: a contract names the events a component emits and leaves signatures to
  the compiler.** *What:* an optional root `events` of bare names or records
  (SR-161). A publisher fails a name used as both a prop and an event (SR-162). A
  consumer treats a listed event as declared and sets it aside before validating
  a prop bag (SR-163). *Why:* a callback is not a JSON value, so `props` cannot
  type it honestly. v0.1 left two bad choices: declare `onClick` with a false
  `type`, or omit it and have a closed contract flag every working handler. Typing
  each signature was considered and rejected. A single design system has dozens of
  distinct signatures, many over its own domain types, so a contract would have to
  restate a type system the source language's compiler already enforces, and could
  disagree with it. A contract needs the name; the compiler has the signature.
  *Prior art:* the Custom Elements Manifest has `events` with `name`, `summary`,
  `description`, a required `type`, and `deprecated`. Southleft's `ds-contracts-poc`
  has `events` with `name`, `description`, and framework `bindings`. This entry
  takes the member name and those shared fields. It drops `type` for the reason
  above and keeps `deprecated` boolean to match D-82. It does not take the
  `bindings` map: one name per usage form is written directly, as `exports`
  records several. DSDS documents events as prose in a `definitions` section and
  has no event data; the shadcn registry and DTCG have no equivalent, and neither
  does `@directededges/specs-schema`. *Not included:* payload shapes, bubbling or
  cancelation, and any way to say an event is required. *Cost:* one optional member
  and a publish-time check. A consumer cannot catch a handler with the wrong
  signature from the contract alone. A component written for several frameworks
  lists each framework's spelling or has a contract per framework, because a name
  is matched as usage code writes it.
