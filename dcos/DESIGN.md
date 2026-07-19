# DESIGN.md — flarum-ext-co-authors

Architecture and design decisions for the NGBC co-writing extension (Flarum 2.x).

## 1. Concept

Co-authorship is a **discussion-level** relationship. A discussion has one author (the OP, Flarum core) plus zero or more co-authors managed by this extension. Co-authorship conceptually applies to the discussion's first post: accepted co-authors may edit it (Level B).

Feature levels for reference:

- Level A — credit only (display, no rights)
- **Level B — credit + first-post edit rights ← chosen, with a toggle to fall back to A**
- Level C — full collaboration (drafts, live editing) — explicitly out of scope for v1; the data model must not block it later

## 2. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| D1 | Feature level | B (credit + first-post edit), settings toggle to disable edit rights |
| D2 | Add flow | Invitation with accept/decline; **admin/mod adds are instant** (`accepted` immediately) |
| D3 | Declined invitations | Row deleted, no stored `declined` state (re-invite possible) |
| D4 | Permission | New global permission `discussion.coWrite.invite`; no tag scoping |
| D5 | No permission | Composer field + manage control hidden; all write endpoints 403 |
| D6 | Permission revoked later | **Freeze**: existing co-authors keep rights/display; only mods manage that list from then on |
| D7 | Display pattern | Stacked mini avatars; text `"author with coauthor"`, names for ≤3 total, else `"author with N more people"` |
| D8 | Discussion page display | Same shared byline component on the first post; no DiscussionHero changes; pending shown as dashed-outline avatar to OP/invitee only |
| D9 | Storage | Extension-owned pivot table; no Flarum groups, no core-table changes |
| D10 | Edit attribution | Core behavior (last editor in `edited_user_id`) — acceptable for v1 |
| D11 | Profile visibility | Co-authored discussions appear on the co-author's profile via **feed merge** into the existing Discussions tab (not a separate tab) |

## 3. Data model

```sql
discussion_co_authors
  id            BIGINT PK
  discussion_id BIGINT FK -> discussions.id  ON DELETE CASCADE
  user_id       BIGINT FK -> users.id        ON DELETE CASCADE
  added_by_id   BIGINT FK -> users.id        NULLABLE (SET NULL on delete)
  status        ENUM('pending','accepted')   DEFAULT 'pending'
  created_at    TIMESTAMP
  responded_at  TIMESTAMP NULLABLE           -- set on accept

  UNIQUE (discussion_id, user_id)
  INDEX  (user_id, status)
```

State machine:

```
(none) --invite by OP w/ permission--> pending --accept--> accepted
(none) --add by mod/admin-----------> accepted
pending --decline / remove----------> (row deleted)
accepted --remove (self, OP w/ permission, or mod)--> (row deleted)
```

Notes:
- `UNIQUE(discussion_id, user_id)` prevents duplicate invites.
- Future Level C can add a nullable `post_id` column without migration pain.
- Validation on write: user exists, user ≠ discussion OP, count ≤ `max_co_authors` setting.

## 4. Backend architecture (PHP)

### Extenders (`extend.php`)

- `Model(Discussion::class)->hasMany`/`belongsToMany` → `coAuthors()` relationship (through pivot model `CoAuthor`).
- `ApiSerializer(DiscussionSerializer::class)` → include `coAuthors` relationship (only `accepted` publicly; `pending` included only for OP/invitee/mods via conditional logic).
- `Routes('api')` → three endpoints (below).
- `Policy` → permission registration + `PostPolicy` edit override.
- `Notification` → two blueprints.
- `Settings` → serialize `max_co_authors`, `edit_rights` to forum payload.
- `Locales`.

### API endpoints

| Method | Path | Action | Gate |
|--------|------|--------|------|
| POST | `/discussions/{id}/co-authors` | Invite user (or instant add if actor is mod/admin) | `coWrite.invite` + OP, or mod |
| PATCH | `/discussions/{id}/co-authors/{userId}` | Accept invitation | actor == invitee, status == pending |
| DELETE | `/discussions/{id}/co-authors/{userId}` | Decline / remove / leave | invitee (self), OP w/ permission, or mod |

Additionally, `relationships.coAuthors` in the discussion **create** payload is honored (so co-authors can be attached from the composer at creation) behind the same gate; on **update** payloads it is rejected in favor of the explicit endpoints (single code path for state transitions).

### Authorization

```
canManageCoAuthors(actor, discussion):
    actor.isMod() OR (actor.can('discussion.coWrite.invite') AND actor.id == discussion.user_id)
```

- D6 freeze falls out naturally: an OP who lost the permission fails this check; rows are simply left alone.
- `PostPolicy::edit` override: allow if post is the discussion's **first post**, actor is an **accepted** co-author, and setting `edit_rights` is on. Runs in addition to core policy (never restricts, only grants).

### Notifications

- `CoAuthorInvitedBlueprint` — "X invited you to co-write [title]". Sent on pending-row creation. Links to the discussion (accept/decline banner there).
- `CoAuthorAddedBlueprint` — "X added you as a co-author on [title]". Sent on instant admin add.
- Both registered for alert channel; email optional. Future: bridge into `flarum-ext-line-notification` (Flex Message invite with accept link).

## 5. Frontend architecture (Mithril/TS)

### Components

- **`CoAuthorSearchField`** — user search/tag-input in `DiscussionComposer` header. Reuses the mentions-style user search source. Rendered only if `app.forum.attribute('canCoWriteInvite')` (serialized per-actor) — permission-gated at render.
- **`CoAuthorByline`** — the single shared display component used in both `DiscussionListItem` and the first `PostUser` area:
  - stacked mini avatars (author + accepted co-authors, max 3 avatars visible)
  - text: `author` alone → nothing extra; ≤3 total → "author with b", "author with b, c"; >3 → "author with N more people" (N = coAuthors − 2). Truncation threshold is a single exported constant.
  - pending co-authors: dashed-outline avatar + tooltip, rendered only for OP/invitee/mods.
- **`CoAuthorInviteBanner`** — banner above the first post, shown to a pending invitee: Accept / Decline buttons hitting the PATCH/DELETE endpoints. (Chosen over buttons inside the notification dropdown — simpler and more reliable.)
- **`ManageCoAuthorsModal`** — opened from a discussion-controls item; lists current + pending co-authors with remove buttons and the search field to invite more. Item visible per the same gate (or mod).

### Admin

- Permission grid: `discussion.coWrite.invite` registered under the Start category.
- Settings page: `max_co_authors` (number, default 5), `edit_rights` (toggle, default on).

## 6. Display spec (agreed wording)

| Situation | List/byline text |
|-----------|------------------|
| 0 co-authors | (core default, no change) |
| 1 | `somchai with malee` |
| 2 | `somchai with malee, nadia` |
| 3 | `somchai with malee, nadia, ploy` |
| 4+ | `somchai with 3 more people` (all co-author names collapse) |

Avatars: author full-size (core), then up to 3 stacked mini avatars overlapping; 4+ shows `+N` chip as the third element. Exact numbers behind the shared constant so they're tunable.

All strings via i18n keys (`en.yml`, `th.yml`); the "with N more people" form uses pluralization.

## 7a. Profile feed merge (D11)

Co-authored discussions must show up in a user's normal profile "Discussions" list, mixed in with their own — not a separate tab.

**Backend approach:** Flarum's profile discussions list is served by the standard `/api/discussions?filter[author]=id` query (the `AuthorGambit`/user-scope filter driving `UserPage`'s discussions tab). To merge in co-authored discussions:

- Extend the discussions search pipeline (`SearchCriteria`/`Gambit` extender or a `Filter` extender) so that when the `author` filter is active, the query becomes: `discussions.user_id = X OR discussions.id IN (SELECT discussion_id FROM discussion_co_authors WHERE user_id = X AND status = 'accepted')`.
- Implemented by modifying the existing author filter (small `WHERE EXISTS`/`orWhereIn` subquery) rather than a full custom gambit, to avoid duplicating core's other filter/sort behavior (sticky, hidden, tag scoping, etc. must keep working unchanged).
- Only `accepted` rows count — pending/declined never appear.
- Sort/pagination must stay correct with the merged set (test with a user who has both authored and co-authored discussions interleaved by recency).

**Frontend implication:** no separate component needed — `DiscussionListItem` already renders via `CoAuthorByline` (Phase 5), so a co-authored discussion appearing in someone else's profile list will correctly show "author with thisUser" automatically. No new frontend work beyond what Phase 5 already builds.

**Risk noted:** this touches a core query path shared by search/index/profile, so it needs care not to slow down or break the main discussion list. Keep the merge logic isolated to the `author`-filter code path only — the global discussion index (no author filter) must be untouched.

## 7. Out of scope (v1)

- Tag-scoped permissions
- Per-post co-authors / live collaborative editing (Level C)
- Stored declined state, invite cooldowns
- Edit-history attribution beyond core's last-editor field
- Search gambit `co-author:username` (planned v1.1)
- LINE notification bridge (planned after v1, via flarum-ext-line-notification)
