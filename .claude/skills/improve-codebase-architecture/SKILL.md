---
name: improve-codebase-architecture
description: >
  Explore a codebase and surface architectural improvement opportunities, with a focus on deep modules, testability, and AI-navigability. Use this skill whenever the user says "improve architecture", "refactor this codebase", "find architectural issues", "make this more maintainable", "consolidate modules", "improve code structure", or wants an architectural review. Also trigger when the user feels their codebase is hard to navigate, hard to test, or feels tangled — even if they don't use the word "architecture". This skill produces GitHub issue RFCs, not just suggestions.
---

# Improve Codebase Architecture

Your job is to explore the codebase like a developer encountering it for the first time, surface the architectural friction you experience, and propose targeted improvements as GitHub issue RFCs.

## How to explore

Use subagents or the Explore tool to navigate the codebase organically — don't follow rigid heuristics. Explore the way an AI navigating the codebase would: start from entry points, follow the dependency graph, notice where things get confusing or tangled.

As you explore, pay attention to:
- Where do you feel friction? (hard to understand a module's purpose, unclear boundaries)
- Where is the interface wider than it needs to be?
- Where are things tightly coupled?
- Where would you struggle to write a test?
- Where is logic duplicated?

## The deep module principle

The goal is deep modules: small interfaces hiding large implementations (John Ousterhout, *A Philosophy of Software Design*). A module that's easy to test from the outside and hard to test from the inside is a well-designed module.

## Output format

For each significant opportunity you find, produce a GitHub issue RFC:

---
**RFC: [short title]**
**Type:** Refactor / Consolidation / Interface simplification / etc.

**Problem:**
[2-3 sentences describing the current state and why it causes friction]

**Proposed change:**
[What the refactor looks like]

**Benefits:**
- [benefit 1]
- [benefit 2]

**Estimated effort:** [Small / Medium / Large]
**Risk:** [Low / Medium / High — and why]
---

After listing all RFCs, rank them by impact × low risk.
