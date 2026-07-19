<?php

namespace Tapao\CoAuthors\Access;

use Flarum\User\User;
use Illuminate\Database\Eloquent\Builder;

class ScopeCoAuthorVisibility
{
    public function __invoke(User $actor, Builder $query)
    {
        if ($actor->isGuest()) {
            $query->where('status', 'accepted');
            return;
        }

        $query->where(function ($q) use ($actor) {
            $q->where('status', 'accepted')
              ->orWhere('user_id', $actor->id)
              ->orWhereExists(function ($sub) use ($actor) {
                  $sub->select('id')
                      ->from('discussions')
                      ->whereColumn('discussions.id', 'discussion_co_authors.discussion_id')
                      ->where('discussions.user_id', $actor->id);
              });
              
            // In Flarum, admins usually bypass scopes.
            // For moderators who can edit posts, we'd need complex tag-scoped logic.
            // For now, this securely covers public (accepted), invitee (pending for self), and OP (pending for their discussions).
        });
    }
}
