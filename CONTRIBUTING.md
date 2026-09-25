# Contributing

Thanks for your interest in the Design System Contract. Issues and pull requests are welcome.

## Before you start

- **Questions, bugs, and proposals:** open an issue. For a change to the format itself, start with
  an issue so the change can be discussed before anyone writes it up.
- **Typos and clarifications:** a pull request is fine on its own.

## Changing the format

The JSON Schemas in `schemas/` are the ground truth for every artifact's shape. A change that alters
what a schema accepts or means (a new member, a renamed one, a changed type or cardinality) needs:

1. **A decision entry** in the "Resolved decisions" section of `spec/spec.md`, saying what changes,
   why, and what it costs. Write it before, or alongside, the schema change.
2. **A prior-art check.** Before adding a field, look at whether DSDS, the Custom Elements Manifest,
   the shadcn registry, DTCG, or JSON Schema already names the concept. If one does, use its name.
   Record what you found in the decision entry.
3. **Updated examples and tests.** `npm test` must pass.

The principles every change must respect are in `spec/constitution.md`. The main ones: the format
stays open, every check stays deterministic, and the format composes with neighboring standards
rather than replacing them.

## Pull requests

- Run `npm install` and `npm test` before opening a pull request.
- Keep one change per pull request.
- Use American English.

## License

This project is licensed under the [Apache License 2.0](LICENSE). By submitting a contribution you
agree that it is licensed under the same terms, as described in section 5 of the license.
