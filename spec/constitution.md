# Constitution — Design System Contract

**Version:** 6.0.0 · **Ratified:** 2026-07-29 · **Last amended:** 2026-11-17 · **Amendment:** editorial-history

This file outranks defaults in every process that produces or changes the specification. Where it is
silent, defaults apply. Where it speaks, it wins.

**Product frame.** An open **Design System Contract** format, licensed Apache-2.0, that expresses a
design system's components as machine-readable contracts: one JSON file per component plus a
manifest that lists them. Version 0.1 is the format only. Tooling built on the format is a separate
concern. The posture is open spec, commercial implementation: adoption of the format is the goal;
capture of the format is not.

**Standing rulings.** Two rulings predate this file and bind it: the format is open, licensed
Apache-2.0, and written as if public from day one; and evaluation layers are designed
independently, never depending on an external eval suite. Where this constitution conflicts with
either ruling, the conflict goes to the maintainers rather than being silently resolved.

---

## Prohibitions

Hard stops. A spec change, schema change, or generated artifact that violates any of these is
invalid — not traded off, not scored, not merged. Escaping them requires an amendment, never a
judgment call.

- **PROH-1 — The contract format is never framed as proprietary IP.** The Design System Contract
  spec and its schemas are open and licensed **Apache-2.0**, chosen over MIT for its express patent
  grant, which matters for a format other parties are expected to implement. No spec file, schema
  file, README, or generated artifact may assert proprietary ownership, exclusive licensing, or use
  restriction over the format itself. Monetization lives in **services** — never in the spec or the
  schemas. *A format a competitor cannot safely adopt does not become a standard.*
- **PROH-2 — No model inference in a mechanical check.** Every check this specification names —
  schema validation, the fold, collision detection, content-address recomputation, publish-time prop
  checks, and any future deterministic checker — is deterministic: same inputs, same output, no
  network model call, no sampling. Judgment belongs to a separate evaluation layer, never to a
  check whose result a build or an attestation relies on. *A check that cannot hallucinate is what
  makes its result worth signing.*
- **PROH-3 — DTCG tokens are carried byte-verbatim.** Dormant in v0.1, where tokens are deferred,
  and binding on any version that carries them: tokens enter, are stored, and are served as the
  exact bytes received. No transformation, normalization, re-serialization, key reordering, or house
  dialect. A derived view may exist **alongside** the verbatim bytes; it never replaces them.
- **PROH-4 — Compose with the ecosystem; never replace it.** DTCG, DSDS, the Custom Elements
  Manifest, the shadcn registry, and JSON Schema are composed with as-is. No competing re-definition
  of what they already define. Before any new contract field is invented, prior art is checked —
  DSDS, CEM, the shadcn registry, DTCG, and Southleft's `ds-contracts-poc` — and the check is
  recorded in the spec's decisions. An unrecorded novel field is a violation, not a style choice.
- **PROH-5 — The published schema is the ground truth.** The JSON Schemas published with this
  specification are the normative source for every artifact's shape and key names. Where prose in
  the spec, the README, or any other document disagrees with a published schema, the schema is
  correct and the prose is the defect. Any change to a schema's semantics — a renamed member,
  changed cardinality, altered meaning, or dropped structure — requires a decision entry in the
  spec's Resolved decisions recording what changed and why, written **before** the change lands.
  Change is permitted; unrecorded change is not.

---

## Preferences (soft)

Defaults, not gates. A change may depart from these with a recorded rationale; departing without one
is a finding.

- **Prefer additive spec changes** (new `SCN` / `SR`) over restructures or edits to existing ones.
- **Prefer boring JSON Schema over novel formats.** JSON on disk, JSON Schema 2020-12 for
  validation, standard tooling. Novelty in the format is a cost paid by every consumer.
- **Prefer field names that match prior art** over house names. Where DTCG, CEM, DSDS, the shadcn
  registry, or JSON Schema already names a concept, use their name even when a better one exists.
- **Prefer porting proven prior art over novel design.** Reference, do not fork.
- **Prefer mechanical checks first, judgment later.** A property that cannot be expressed as a
  deterministic check is stated as such, not approximated inside a checker.
- **Prefer visible human sign-off over silent automation** on anything that produces an
  attestation or a score.
- **American English throughout** — spec text, schema descriptions, and generated artifacts.

---

## Violation policy

- This constitution may be amended through the spec-change process. Amendments are always a
  **major** increment, regardless of textual size, and always require a maintainer decision. The process
  refuses to soften a prohibition or a change-control item without explicit direction from the
  maintainers.
- Work that would violate this constitution **halts** and surfaces the conflict. It does not
  proceed under protest, does not downgrade the violation to a finding, and does not route around
  the prohibition with an equivalent construct.
- A conflict with a prohibition is resolved only by amendment or by withdrawal of the offending
  work — never by a scoring trade-off.

---

## Change control

These changes need an explicit maintainer decision before they land:

- **CC-1** — Any amendment to this constitution.
- **CC-2** — Any change to a published schema. The format *is* the open spec; a schema change is a
  change to a published standard, and PROH-5 requires its decision entry first.
- **CC-3** — Modifying or removing an existing scenario, requirement, or invariant in the
  specification, or a breaking glossary change.
- **CC-4** — Deprecating a contract or manifest member that consumers may already read.
- **CC-5** — A new contract field with no prior-art precedent (PROH-4's check finds no DSDS, CEM,
  shadcn registry, DTCG, or `ds-contracts-poc` analog). A person, not a tool, does the inventing.
- **CC-6** — Any one-way-door decision: license, repository home, the format's name, or on-disk
  layout.

Suppressing one of these is a violation; raising one is not a failure.

---

## Amendment history

**v6.0.0, 2026-11-17.** Editorial: the product frame, the standing rulings, and one preference are
reworded more briefly; the violation policy names change-control items; this history lists public
versions only. No prohibition or change-control item changed.

**v5.0.0, 2026-09-24.** Prepared for public release. No prohibition changed.
