# Tabellone — Documentation Guide for Cursor Agents

This folder is the **single source of truth** for what the Cursor agent should build.

## How to use these docs

1. **Fill in** the templates below with your real requirements (copy from your PDFs/Word docs).
2. **Keep Phase 1 scope only** in `phase-1/` — do not mix Phase 2/3 features here.
3. **Start each Cursor chat** with: *"Read `docs/phase-1/PHASE-1-SPEC.md` and implement [specific task]."*
4. **Work in slices** — one module per session (e.g. auth, company CRUD, IMD import).

## Folder structure

```
docs/
├── README.md                 ← you are here
├── PRODUCT-OVERVIEW.md       ← what Tabellone is (all phases, brief)
├── phase-1/
│   ├── PHASE-1-SPEC.md       ← master spec — agent reads this first
│   ├── USER-STORIES.md       ← who does what, acceptance criteria
│   ├── DATA-MODEL.md         ← entities, fields, relationships
│   ├── API-CONTRACT.md       ← endpoints, request/response shapes
│   ├── UI-SCREENS.md         ← screens, navigation, wireframe notes
│   └── OUT-OF-SCOPE.md       ← explicit Phase 2/3 exclusions
└── reference/                ← optional: paste excerpts from uploaded PDFs
```

## What works best for AI agents

| Approach | Works? | Why |
|----------|--------|-----|
| One 50-page PDF only | Poor | Hard to reference; agent may miss details |
| Structured markdown in repo | **Best** | Searchable, versioned, linkable |
| `.cursor/rules/` for conventions | **Best** | Persistent coding standards |
| `AGENTS.md` at repo root | **Best** | Project map + build commands |
| Chat-only explanations | Weak | Context is lost between sessions |

## Uploading your existing documents

Copy source files into this project folder, e.g.:

- `docs/reference/phase-1-original.pdf`
- `docs/reference/imd-spec.docx`

Then tell the agent: *"Extract requirements from `docs/reference/` into `docs/phase-1/`."*
