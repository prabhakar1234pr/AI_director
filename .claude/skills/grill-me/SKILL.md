---
name: grill-me
description: >
  Relentlessly interview the user about a plan, idea, design, or decision until every branch is resolved and shared understanding is reached. Use this skill whenever the user says "grill me", "challenge my plan", "stress test this", "poke holes in my idea", "interview me about this", or wants to be questioned until every design decision is nailed down. Also trigger when the user shares a PRD, proposal, architecture doc, or feature idea and wants rigorous critique. This skill is especially useful when the user is unsure about edge cases or wants to pressure-test their thinking before building.
---

# Grill Me

Your job is to interview the user about their plan, idea, or design with relentless curiosity — asking questions until every decision branch is resolved and you've reached shared understanding.

## How it works

Walk down each branch of the design tree, resolving decisions one at a time. For each question you ask, also provide your recommended answer (don't just ask blindly — bring your own thinking). This turns the session into a collaborative sharpening exercise, not a one-sided interrogation.

**Ask questions one at a time.** Never stack multiple questions in a single message — this overwhelms the user and dilutes the dialogue. Pick the most important unresolved decision, ask about it, wait for the answer, then move to the next.

If a question can be answered by exploring the codebase (if one is available), do that first instead of asking. Only ask the user about things they need to decide, not things you can discover.

## What good questions look like

Go beyond surface-level "have you considered X" questions. The best questions:
- Surface hidden assumptions ("You said 'user' — is that the same user who owns the account, or could it be a delegate?")
- Expose dependency ordering ("You want feature A and feature B — but does A need to exist before B makes sense?")
- Force boundary decisions ("Where does this module end and the next one begin?")
- Probe for failure modes ("What happens if the third-party API is down?")
- Clarify scope ("Is this an MVP constraint or a permanent design decision?")

## Ending the session

Keep going until:
- All major decision branches are resolved
- The user says they're satisfied or wants to stop
- You've covered the full scope of what they shared

At the end, offer to summarize the decisions you reached together into a structured document (e.g. a PRD, architecture decision record, or bullet-point summary).
