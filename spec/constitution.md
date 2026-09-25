# Constitution — Design System Contract

**Version:** 5.0.0 · **Ratified:** 2026-07-29 · **Last amended:** 2026-09-24 · **Amendment:** public-reader-change-control

This file outranks defaults in every process that produces or changes the specification. Where it is
silent, defaults apply. Where it speaks, it wins.

**Product frame.** An open **Design System Contract** format, licensed Apache-2.0, that expresses a
design system's components as machine-readable contracts: one JSON file per component plus a
manifest that lists them. Version 0.1 is the format only. Tooling that syncs, verifies, or scores
against the format, and any hosted verification or attestation service, are separate concerns. The
posture is open spec, commercial implementation: adoption of the format is the goal; capture of the
format is not.

**Standing rulings.** Two rulings predate this file and bind it: the format is open, licensed
Apache-2.0, and written as if public from day one, with commercial value living only in services
built on it; and evaluation layers are designed independently, never depending on an external eval
suite. Where this constitution conflicts with either ruling, the conflict goes to the maintainers
rather than being silently resolved.

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
  attestation or a score a customer will quote.
- **American English throughout** — spec text, schema descriptions, and generated artifacts.

---

## Violation policy

- This constitution may be amended through the spec-change process. Amendments are always a
  **major** increment, regardless of textual size, and always require a maintainer decision. The process
  refuses to soften a prohibition or an escalation trigger without explicit direction from the
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

**v5.0.0 — 2026-09-24.** Public-reader trim for the v0.1 release. **Changed:** the rulings of record
are stated by content rather than by internal document name, and escalate to the maintainers; the
violation policy's "human owner" becomes the maintainers. **Replaced:** the internal effort
machinery section (escalation triggers routed to internal review roles, dispatch overrides, budgets
and weight class) with a Change control section. ESC-D1, ESC-D2, ESC-D3, ESC-D4, ESC-E1, ESC-E2, and
ESC-E5 carry over as CC-1 to CC-6 (D2 and D3 merged into CC-3), each now requiring a maintainer
decision. **Removed:** ESC-D5 (eval-mapping acknowledgment) and the internal-only ESC-E3, E4, E6, E7,
dispatch overrides, and budgets, which bound only the internal process that produced the
specification. **Not softened:** no prohibition changed; every carried-over trigger still requires a
human decision.

**v4.0.0 — 2026-09-24.** Public-release trim and schema ground truth, companion to spec 0.10.0
(D-70 – D-80). **Changed:** the product frame now describes the format-only v0.1 and drops the
tooling wedge and the internal-format lineage; PROH-2 re-anchored from a deferred command's verify
path to every mechanical check the specification names; PROH-3 marked dormant in v0.1 and binding
on any version that carries tokens; PROH-4's prior-art list drops the internal format and the
generic-plugin clause (the latter survives as ESC-E7, marked internal); **PROH-5 re-anchored** from
"no silent divergence from an internal schema" to "the published schema is the ground truth", with
decision entries in the spec replacing the internal decision log as the record of change (D-74);
Preferences drop the internal-format name, the envelope reference, and the TypeScript house rules;
ESC-E2 drops the CLI and MCP surfaces and keeps contract members; ESC-E3, E4, E6, E7 marked internal
effort only; ESC-E5's list drops the internal format; Budgets compressed to the ratified figures
with the calibration narrative archived. **Removed:** the Narrator context section in full
(stakeholder names, a chat-canvas identifier, and the four-track validation plan — internal
material not for a public reader); every file path into a private knowledge base or another
repository; every reference to the internal brief and its decision log. Rulings of record are now
referenced by name, not path. **Not softened:** every prohibition is at least as strong as in
v3.0.0 — PROH-2 now binds more checks, not fewer; PROH-5 binds against a published artifact anyone
can verify rather than an internal one. Human-approved under ESC-D1 on 2026-09-24 as part of the
v0.1 release docket.

**v3.0.0 — 2026-07-30.** License alignment: PROH-1 pinned to Apache-2.0 per the spec-openness
policy ruling of record; rulings-of-record paragraph added. A tightening, not a softening.

**v2.0.0 — 2026-07-30.** Added Budgets and weight class, ratifying figures the first two
generations had run on informally. No prohibition, trigger, or preference changed.

**v1.0.0 — 2026-07-29.** Initial ratification: five prohibitions, nine soft preferences, twelve
escalation triggers, no dispatch overrides.
