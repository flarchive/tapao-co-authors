<?php

namespace Tapao\CoAuthors\Access;

use Flarum\Discussion\Discussion;
use Flarum\User\Access\AbstractPolicy;
use Flarum\User\User;

class DiscussionPolicy extends AbstractPolicy
{
    public function manageCoAuthors(User $actor, Discussion $discussion)
    {
        if ($actor->hasPermission('discussion.coWrite.invite') && $actor->id === $discussion->user_id) {
            return $this->allow();
        }

        if ($actor->can('editPosts', $discussion)) {
            return $this->allow();
        }
    }
}
