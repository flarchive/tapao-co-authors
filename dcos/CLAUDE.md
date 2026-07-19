# CLAUDE.md — flarum-ext-co-authors

Project instructions for AI-assisted development sessions. Read this first, then `DESIGN.md` for architecture and `PLAN.md` for the build sequence.

## What this project is

A **Flarum 2.x extension** that adds co-writing (co-authorship) to discussions:

- The discussion starter can invite other users as **co-authors** at creation time or later.
- Invitations require **accept/decline** — except when an admin/moderator adds someone, which is instant.
- Accepted co-authors get **edit rights on the first post** of the discussion (Level B: credit + edit, toggleable down to credit-only).
- Co-authors are displayed as **stacked avatars** with the text pattern `"author with coauthor"` / `"author with 2 more people"` when more than 3.
- A dedicated **global permission** (`discussion.coWrite.invite`) gates the feature. Without it: UI hidden, API returns 403.

Deployed target: the NGBC community forum at `ngbc.kku.ac.th` (Flarum 2.x).

## Tech constraints

- **Flarum**: `flarum/core: ^2.0` — trust the 2.x source code over 1.x-era tutorials. Import paths and the frontend export registry changed in 2.x.
- **PHP**: 8.2+ (match Flarum 2.x requirements). PSR-12 style.
- **Frontend**: Mithril + TypeScript, built with the official `flarum/cli` 2.x skeleton webpack config. Do not hand-roll the build setup.
- **Database**: one migration, table `discussion_co_authors`. No modification of core tables. No Flarum groups used as data storage — the extension's own table is the sole source of truth (consistent with other NGBC extensions).

## Hard rules (do not violate)

1. **Permission gate on every write path.** The invite/remove endpoints AND the `relationships.coAuthors` payload during discussion save must all check the permission. Never rely on hidden UI as the security boundary.
2. **Global permission only.** No tag-scoping. Policy check is: `(actor has coWrite.invite AND actor is discussion OP) OR actor is mod/admin`.
3. **Freeze semantics.** If a user loses the permission, existing co-author rows stay untouched and functional (edit rights, display). Only mods can then manage that discussion's co-author list.
4. **Only `accepted` rows count.** `pending` invitees get no edit rights and no public display — visible only to the OP and the invitee themselves.
5. **Declined = row deleted.** No `declined` status is stored.
6. **Admin/mod adds skip invitation** — row created directly as `accepted`, with an "added" notification instead of an "invite" notification.
7. **First-post edit override is behind a settings toggle** (`co-authors.edit_rights`, default on). When off, the extension is credit-only (Level A behavior).

## Naming conventions

- Composer package: `ngbc/flarum-ext-co-authors`
- Extension ID: `ngbc-co-authors`
- Permission key: `discussion.coWrite.invite`
- Settings keys prefix: `ngbc-co-authors.` (e.g. `ngbc-co-authors.max_co_authors`, `ngbc-co-authors.edit_rights`)
- Translation keys prefix: `ngbc-co-authors.`
- Frontend components live in `js/src/forum/components/`, shared byline component name: `CoAuthorByline`

## Testing / verification

- Set up against a local Flarum 2.x install (`flarum/flarum` skeleton) via composer path repository.
- Manual test matrix lives in `PLAN.md` (Phase 7). At minimum verify: permission off → 403 on raw API POST; pending invitee cannot edit first post; admin add is instant; avatar truncation at >3.
- Run `composer test` if/when phpunit integration tests are added (Flarum provides `flarum/testing`).

## Language / i18n

- Ship `locale/en.yml` and `locale/th.yml` from day one — the NGBC forum runs primarily in Thai.
- All user-facing strings go through the translator; no hardcoded English in components.

## Session workflow

1. Check `PLAN.md` for the current phase and its checklist.
2. Make changes for one phase at a time; keep commits scoped per phase.
3. Update the checkboxes in `PLAN.md` when a phase item is done.
4. If a design decision is missing or ambiguous, ask the user (Tapao) — do not invent new scope. Decisions already made are recorded in `DESIGN.md` § Decisions.
