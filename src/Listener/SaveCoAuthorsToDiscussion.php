<?php

namespace Tapao\CoAuthors\Listener;

use Flarum\Discussion\Event\Saving;
use Illuminate\Support\Arr;
use Tapao\CoAuthors\CoAuthor;

class SaveCoAuthorsToDiscussion
{
    public function handle(Saving $event)
    {
        $discussion = $event->discussion;
        $data = $event->data;
        $actor = $event->actor;

        $relationships = Arr::get($data, 'relationships', []);
        
        if (isset($relationships['coAuthors'])) {
            if ($discussion->exists) {
                throw new \InvalidArgumentException('coAuthors relationship can only be provided during discussion creation. Use explicit API endpoints to manage co-authors.');
            }

            if (!$actor->hasPermission('discussion.coWrite.invite')) {
                throw new \Flarum\User\Exception\PermissionDeniedException();
            }

            $coAuthorData = Arr::get($relationships['coAuthors'], 'data', []);

            $discussion->afterSave(function ($discussion) use ($coAuthorData, $actor) {
                $isMod = $actor->can('editPosts', $discussion);

                foreach ($coAuthorData as $coAuthorDataRow) {
                    $userId = Arr::get($coAuthorDataRow, 'id');
                    if ($userId && $userId != $discussion->user_id) {
                        CoAuthor::build(
                            $discussion->id, 
                            $userId, 
                            $actor->id, 
                            $isMod ? 'accepted' : 'pending'
                        )->save();
                    }
                }
            });
        }
    }
}
