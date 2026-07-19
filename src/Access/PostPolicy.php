<?php

namespace Tapao\CoAuthors\Access;

use Flarum\Post\Post;
use Flarum\Settings\SettingsRepositoryInterface;
use Flarum\User\Access\AbstractPolicy;
use Flarum\User\User;
use Tapao\CoAuthors\CoAuthor;

class PostPolicy extends AbstractPolicy
{
    protected $settings;

    public function __construct(SettingsRepositoryInterface $settings)
    {
        $this->settings = $settings;
    }

    public function edit(User $actor, Post $post)
    {
        if ($post->number === 1) {
            $editRights = (bool) $this->settings->get('tapao-co-authors.edit_rights', true);
            if ($editRights) {
                $isCoAuthor = CoAuthor::where('discussion_id', $post->discussion_id)
                    ->where('user_id', $actor->id)
                    ->where('status', 'accepted')
                    ->exists();

                if ($isCoAuthor) {
                    return $this->allow();
                }
            }
        }
    }
}
