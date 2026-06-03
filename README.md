# Cinelog Claude Frontend Agent Kit

This kit adds Claude Code project instructions, frontend-specific skills, custom subagents, quality gates, prompts, and documentation for continuing the Cinelog frontend inside a monorepo.

It is intentionally stack-aware but not stack-assuming: Claude must inspect `apps/frontend` before deciding commands, routing, component conventions, styling tools, test framework, or build scripts.

## Intended repo layout

```txt
cinelog/
  AGENTS.md
  CLAUDE.md
  apps/
    backend/
    frontend/
  docs/
    backend/
    frontend/
  .claude/
    agents/
    rules/
    skills/
  prompts/
    claude/
```

## Safety model

- `apps/frontend/**` is Claude's main editable area.
- `apps/backend/**` is read-only unless the user explicitly approves a backend contract/documentation change.
- The current unique visual design must be preserved. Claude must not replace it with generic templates, generic Tailwind layouts, or a full rewrite.
- No new UI library, styling system, animation library, state manager, or API client may be introduced without explicit approval.
- Use the smallest coherent diff per task.
- Run validation gates before reporting completion.
- Keep design, API, PWA, and frontend handoff documentation updated.

## First Claude commands

From the repository root:

```bash
claude --version
claude
```

Then paste:

```txt
Read CLAUDE.md and prompts/claude/00-start-session.md. Do not modify files yet. Summarize the frontend agent system, available skills, and the safe first action.
```

After that, use:

```txt
Run prompts/claude/01-discover-frontend.md.
```

## Optional MCP setup

### Playwright MCP

Useful for browser-driven QA, accessibility snapshots, screenshots, and interaction checks.

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

Only enable unsafe Playwright code execution for trusted local work.

### Figma MCP

Only use this if the design source is in Figma or Figma Make.

```bash
claude plugin install figma@claude-plugins-official
```

Restart Claude Code after plugin installation, then authenticate through `/plugin`.

## Notes

This kit does not implement product code. It only gives Claude operational structure.
