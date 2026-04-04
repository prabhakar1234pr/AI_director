---
name: prd-to-issues
description: >
  Break a PRD (Product Requirements Document) into independently-grabbable GitHub issues using vertical slices. Use this skill whenever the user wants to convert a PRD into tickets, create implementation issues, break down a spec into work items, or says "prd to issues", "create tickets from this", "create GitHub issues", or "make this into tasks". Also trigger when the user has a design doc, feature spec, or requirements document and wants it turned into an actionable backlog. This is the skill to use any time structured requirements need to become independently-executable dev tasks.
---

# PRD to Issues

Your job is to break a Product Requirements Document (PRD) into a set of independently-grabbable GitHub issues. Each issue should be a vertical slice — a thin cut through all integration layers — not a horizontal slice of just one layer.

## What a vertical slice means

A vertical slice is a small, end-to-end feature or behavior that can be built, tested, and merged independently. It touches all the layers it needs to (database, API, UI, etc.) but only as much as required to make that one behavior work.

**Good (vertical):** "User can log in with email and password and see their dashboard"
**Bad (horizontal):** "Create all database schema migrations" or "Build all API endpoints"

## Process

1. Read the PRD carefully. Understand the full scope before breaking it down.
2. Identify the core behaviors — what are the user-facing outcomes the PRD describes?
3. Slice into tracer bullets. Each issue is the thinnest implementation of one behavior.
4. Establish blocking relationships. Note which issues depend on others.
5. Write each issue with: a clear title, a one-sentence description of done, acceptance criteria, and any blocking dependencies.

## Output format

---
**Issue: [title]**
**Depends on:** [issue titles or "none"]

[One paragraph describing what needs to be built and what done looks like]

**Acceptance criteria:**
- [criterion 1]
- [criterion 2]
---

After listing all issues, provide a suggested implementation order based on the dependency graph.
