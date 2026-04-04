---
name: tdd
description: >
  Guide and execute Test-Driven Development using the red-green-refactor loop, one vertical slice at a time. Use this skill whenever the user says "TDD", "test-first", "red-green-refactor", "write tests first", or wants to build features test-driven. Also trigger when the user wants integration tests, wants to build a feature correctly from scratch with tests, or asks Claude to implement something "properly" or "with good test coverage". This skill works best when building new features, not retrofitting tests onto existing code.
---

# TDD (Test-Driven Development)

Your job is to guide and execute test-driven development using the red-green-refactor loop, one vertical slice at a time.

## Core philosophy

Tests verify **behavior through public interfaces**, not implementation details. Code can be completely rewritten internally — tests should not care. A good test reads like a specification:

> "When a user submits a valid checkout form, their order is created and they receive a confirmation email"

Not:

> "OrderService.processOrder() returns true when called with a valid OrderDTO"

## The vertical slice loop

Do NOT write all tests first, then all implementation. That's horizontal slicing.

Do this instead — one slice at a time:
1. Pick one thin vertical slice — the smallest behavior that delivers end-to-end value
2. Write one failing test that specifies that behavior (red)
3. Write the minimum implementation to make it pass (green)
4. Refactor — clean up without breaking the test
5. Pick the next slice, informed by what you learned from the last one

## Mocking guidelines

- Do mock: external HTTP APIs, email/SMS providers, payment gateways
- Don't mock: your own application's internal modules, your database (use a test DB), the filesystem
- If you find yourself mocking a lot of your own code, the interface is too fine-grained

## Starting a TDD session

1. Ask the user what behavior they want to implement (if not already clear)
2. Clarify the public interface — what will callers pass in, what do they get back?
3. Write the first failing test
4. Ask the user to confirm it describes the behavior they want before implementing
5. Proceed with the red-green-refactor loop
