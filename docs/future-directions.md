# Future directions

Version 0.1 of the Design System Contract covers two things: the component contract and the
manifest. This note records what was deliberately left out and what each piece would add. It is not
a roadmap and nothing here is a commitment. Any of it enters the format only through the
specification's change process, with a decision entry saying why.

## Design tokens

A `tokens.json` carrying the design system's [DTCG](https://www.designtokens.org/) tokens, **byte
for byte**: no key reordering, no whitespace or number reformatting, no Unicode normalization. A
token's value is often significant to the byte, and a format that reformats another specification's
document has forked it. A derived view could sit alongside the verbatim bytes but never replace them.
Contracts could then bind component properties to tokens, so a checker can tell a hardcoded hex
value from a token reference.

## Richer prop types

v0.1 props carry `type`, `default`, `description`, and `enum`. Array item types, object shapes,
unions, number ranges, and string formats (`items`, `properties`, `anyOf`, `minimum`, `format`) are
all standard JSON Schema and could be added without breaking existing contracts.

## Cross-prop rules

Which enum values may be combined, such as "`size: xs` is never used with `variant: hero`". DSDS
`combos` already expresses this for traits and is the prior art to compose with, ahead of
cva-style `compoundVariants`.

## Strictness per destination

A file declaring destinations (for example prototype, production, marketing), each selected by path
globs, with a default severity and per-rule overrides. It would let one contract be strict in
production code and advisory in a prototype. A path that no destination matches would be treated as
strict.

## An agent-facing index

A short `AGENTS.md` next to the contracts that tells an agent where to look. It would make no
normative statement of its own: an index that grows opinions becomes a second source of truth.

## Provenance, ratification, and signing

An append-only log recording each sync: what happened, when, from which source, and what each
artifact hashed to. On top of it, a way for a design-system owner to confirm (ratify) a contract, and
a signing scheme that makes both verifiable. v0.1's `origin: inferred | synced` is the only trust
signal today; an `authored` origin, for contracts written by hand, would arrive with this work.

## A deterministic checker

A tool that runs every check the specification names, and nothing more:
- schema validation;
- deriving `contractId` from declared names, with rejection and collision detection;
- the publish-time prop checks the schema can't express, such as a `required` name missing from
  `properties`, or a `default` outside its `enum`;
- content-address verification.

Same inputs, same report: no timestamps, no model inference, no network requests. Judgment-based
evaluation would stay separate, because a check that can't hallucinate is what makes its result
worth relying on.

## Derivation profiles

Rules, per kind of source, for which name the `contractId` rule starts from: a React export name, a
Custom Elements Manifest `tagName`, a design-tool component name. v0.1 leaves the choice to the
publisher and asks only that it stay the same from one publish to the next.
