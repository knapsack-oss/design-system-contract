---
version: "0.11.0"
status: draft
last-amended: "2026-09-24"
amendments-pending: 0
mapping-pending: true
effort: contract-spec-wedge
---

# Specification — Design System Contract (format, v0.1)

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
  `props` expressed as JSON Schema 2020-12, optional `slots` and `states`, and
  optional `cemRef` / `shadcnRef` identifiers.
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
    "$schema": "https://knapsack-oss.github.io/design-system-contract/schemas/v0/manifest.schema.json",
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
| cross-prop rules | not in v0.1 | DSDS `combos` is the prior art for v0.2, ahead of cva `compoundVariants` (D-80) |

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
- SR-125: The schema shall require `type` in each `props.properties` entry and shall permit exactly the members `type`, `default`, `description`, and `enum`, with `type` restricted to the 2020-12 type names or an array of them.   # ← SCN-011 (D-71) · amended v0.11.0 (D-81)
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

### Non-functional requirements

- SR-103: The system shall publish a JSON Schema (Draft 2020-12) for each of the two artifact classes — the manifest and the component contract — such that a stock 2020-12 validator with no dependency on this repository validates a conforming document and rejects a non-conforming one.   # ← non-functional, no SCN · retained; amended v0.10.0 (D-70, D-74)
- SR-104: The schema shall set `additionalProperties: false` on every fixed-shape object in both published schemas, exempting from key-space closure every identifier-keyed map — any object whose keys are identifiers this specification does not enumerate, `props.properties` among them.   # ← non-functional, no SCN · retained; amended v0.10.0
- SR-105: The system shall publish the Design System Contract specification and its JSON Schemas under Apache-2.0.   # ← non-functional, no SCN · retained unchanged
- SR-106: The system shall not describe the Design System Contract format as proprietary or as license-restricted in any published artifact.   # ← non-functional, no SCN · retained unchanged
- SR-107: The system shall reference DSDS, Custom Elements Manifest, shadcn-registry, and DTCG constructs by those specifications' own identifiers rather than redefining them in the contract format.   # ← non-functional, no SCN · retained; amended v0.10.0 (AGENTS.md removed with D-70)
- SR-108: Where a component contract carries `cemRef` or `shadcnRef`, a publisher shall carry the referenced entry's identifier only and shall not restate the entry's shape in the contract.   # ← non-functional, no SCN · retained; amended v0.10.0
- SR-142: While its inputs are unchanged, a mechanical check this specification names — schema validation, the fold, collision detection, address recomputation, and the publish-time prop checks — shall produce the identical result on repeated runs.   # ← non-functional, no SCN (INV-1)
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
keywords; cross-prop rules composing with DSDS `combos`; collision detection
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
  a contract with no `props` member is closed (D-71).
- **slot** — a named insertion point, as a bare name or a record with `name`,
  `description`, `a11y` (`role`, `nameFrom`, `required`).
- **state** — a named condition the component can be in, as a non-empty string.
- **manifest** — `manifest.json`: `contractVersion` plus one artifact record per
  component contract.
- **artifact record** — `{ path, address, origin }`; `path` relative to the
  manifest's directory; `origin` is `inferred` (derived without owner
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
publishes (D-81). Profiles are a v0.2 candidate; the fold itself does not change
with the profile.

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
