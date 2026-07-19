# PLAN.md — flarum-ext-co-authors

Phased build plan. Work one phase at a time; check items off as completed. Architecture details are in `DESIGN.md`.

## Phase 0 — Scaffold

- [ ] Generate 2.x extension skeleton with `flarum/cli` (`ngbc/flarum-ext-co-authors`, ID `ngbc-co-authors`)
- [ ] `composer.json`: `flarum/core: ^2.0`, PHP ^8.2, extension metadata (title, icon in NGBC navy/gold)
- [ ] TypeScript + webpack build compiles empty forum/admin entries
- [ ] Local Flarum 2.x dev install wired via composer path repository; extension enables cleanly
- [ ] `locale/en.yml` + `locale/th.yml` stubs

## Phase 1 — Data layer

- [ ] Migration: `discussion_co_authors` table per DESIGN §3 (unique + index, cascades)
- [ ] `CoAuthor` model (casts, relations: discussion, user, addedBy)
- [ ] `Discussion::coAuthors()` relationship via Model extender
- [ ] Manual check: seed rows via tinker/SQL, relationship loads

## Phase 2 — Permissions & policy

- [ ] Register `discussion.coWrite.invite` permission (admin grid, Start category)
- [ ] `canManageCoAuthors` gate helper (OP-with-permission OR mod)
- [ ] `PostPolicy` override: accepted co-author may edit first post, gated by `edit_rights` setting
- [ ] Serialize per-actor `canCoWriteInvite` + per-discussion `canManageCoAuthors` attributes

## Phase 2a — Profile feed merge

- [ ] Extend the `author` filter/gambit so `filter[author]=X` also matches discussions where X has an `accepted` co-author row (per DESIGN §7a)
- [ ] Verify global discussion index (no author filter) is unaffected — isolate the change to the author-filter path only
- [ ] Sort/pagination correctness with mixed authored + co-authored results
- [ ] Manual check: co-author's profile "Discussions" tab shows the discussion with correct byline

## Phase 3 — API

- [ ] POST `/discussions/{id}/co-authors` — invite (pending) / instant add for mods (accepted); validations: exists, ≠ OP, unique, ≤ max
- [ ] PATCH `/discussions/{id}/co-authors/{userId}` — accept (invitee only, pending only; sets `responded_at`)
- [ ] DELETE `/discussions/{id}/co-authors/{userId}` — decline (invitee), remove (OP w/ permission or mod), leave (self, accepted)
- [ ] Discussion **create** payload accepts `relationships.coAuthors` behind the same gate; update payload rejects it
- [ ] Serializer: include accepted co-authors publicly; pending only to OP/invitee/mods
- [ ] 403 verified on every write path without permission (raw HTTP test, not just UI)

## Phase 4 — Notifications

- [ ] `CoAuthorInvitedBlueprint` (on pending creation) — alert channel
- [ ] `CoAuthorAddedBlueprint` (on instant admin add) — alert channel
- [ ] Notification content + links land on the discussion
- [ ] Locale strings (en + th)

## Phase 5 — Forum frontend

- [ ] `CoAuthorSearchField` in DiscussionComposer (render only when `canCoWriteInvite`); attaches co-authors on discussion create
- [ ] `CoAuthorByline` shared component: stacked avatars + "with" text per DESIGN §6; truncation constant
- [ ] Byline mounted in `DiscussionListItem`
- [ ] Byline mounted on first post (PostUser area); pending shown dashed to OP/invitee/mods only
- [ ] `CoAuthorInviteBanner` above first post for pending invitee (Accept / Decline wired to API)
- [ ] `ManageCoAuthorsModal` + discussion-controls item (gated)
- [ ] Mobile check against NGBC custom CSS (login modal / nav customizations must not conflict)

## Phase 6 — Admin frontend & settings

- [ ] Settings page: `max_co_authors` (default 5), `edit_rights` toggle (default on)
- [ ] Permission appears and saves correctly in the grid
- [ ] Settings serialized to forum payload and respected by frontend + policy

## Phase 7 — Verification matrix

- [ ] User without permission: no composer field, no manage control, POST → 403
- [ ] OP with permission: invite → invitee sees banner + notification; accept → byline updates, edit button appears on first post
- [ ] Decline → row gone; re-invite possible
- [ ] Admin add → instant accepted + "added" notification
- [ ] Pending invitee cannot edit first post; not visible to third parties
- [ ] `edit_rights` off → co-authors displayed but cannot edit (Level A fallback)
- [ ] Permission revoked from OP's group → existing co-authors intact (freeze); OP's manage control gone; mod can still manage
- [ ] Truncation: 1/2/3/4+ co-authors render per DESIGN §6, in Thai and English locales
- [ ] max_co_authors enforced at API level
- [ ] Discussion delete / user delete cascade cleanly
- [ ] Co-author's profile Discussions tab shows co-written discussions merged with their own, correctly sorted/paginated; global discussion list unaffected

## Phase 8 — Release

- [ ] README (install, permission setup, settings)
- [ ] Version `1.0.0`, tag, deploy to ngbc.kku.ac.th dev copy → production
- [ ] Backlog recorded: `co-author:` search gambit, LINE notification bridge, invite cooldown, Level C exploration
