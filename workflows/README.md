# Workflows

Markdown SOPs that define what to do and how. The agent reads these to know which tools to run, in what order, and how to handle problems.

## Conventions

- **One file per task type** — e.g. `scrape_website.md`, `enrich_leads.md`
- **Reference tools by path** — e.g. `tools/scrape_single_site.py`
- **Steps are sequential** — write them so a person (or agent) can follow them top to bottom
- **Update when you learn something** — if a tool behaves unexpectedly, document it here

## Required sections

```markdown
# Workflow: <Name>

## Objective
What this workflow accomplishes and why.

## Inputs
- `input_name` — description and format

## Steps
1. Step one (tool: `tools/example.py --flag value`)
2. Step two
3. ...

## Outputs
- What gets produced and where it ends up (e.g. Google Sheet, `.tmp/` file)

## Edge Cases
- What to do if X fails
- Known rate limits or quirks
```

## Example

See any `.md` file in this directory for a real example.
