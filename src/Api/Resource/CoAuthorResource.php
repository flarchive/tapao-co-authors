<?php

namespace Tapao\CoAuthors\Api\Resource;

use Flarum\Api\Resource\AbstractDatabaseResource;
use Flarum\Api\Schema\Str;
use Flarum\Api\Schema\DateTime;
use Flarum\Api\Schema\Relationship\ToOne;
use Tapao\CoAuthors\CoAuthor;

class CoAuthorResource extends AbstractDatabaseResource
{
    public function type(): string
    {
        return 'co_authors';
    }

    public function model(): string
    {
        return CoAuthor::class;
    }

    public function fields(): array
    {
        return [
            Str::make('status'),
            DateTime::make('createdAt')
                ->get(fn(CoAuthor $model) => $model->created_at),
            DateTime::make('respondedAt')
                ->get(fn(CoAuthor $model) => $model->responded_at),
                
            ToOne::make('discussion')
                ->type('discussions')
                ->writable(),
                
            ToOne::make('user')
                ->type('users')
                ->writable(),
                
            ToOne::make('addedBy')
                ->type('users'),
        ];
    }

    public function endpoints(): array
    {
        return [
            \Tobyz\JsonApiServer\Endpoint\Create::make()
                ->saving(function (CoAuthor $coAuthor, \Tobyz\JsonApiServer\Context $context) {
                    $actor = $context->getActor();
                    $discussion = $coAuthor->discussion;

                    if (!$actor->can('manageCoAuthors', $discussion)) {
                        throw new \Flarum\User\Exception\PermissionDeniedException();
                    }

                    // Flarum uses can('editPosts', $discussion) for moderator actions
                    $coAuthor->status = $actor->can('editPosts', $discussion) ? 'accepted' : 'pending';
                    $coAuthor->added_by_id = $actor->id;
                }),

            \Tobyz\JsonApiServer\Endpoint\Update::make()
                ->saving(function (CoAuthor $coAuthor, \Tobyz\JsonApiServer\Context $context) {
                    $actor = $context->getActor();

                    if ($coAuthor->user_id !== $actor->id) {
                        throw new \Flarum\User\Exception\PermissionDeniedException();
                    }
                    if ($coAuthor->status !== 'pending') {
                        throw new \InvalidArgumentException('Already accepted or modified');
                    }
                    
                    // The client might send status = accepted, we force it.
                    $coAuthor->status = 'accepted';
                    $coAuthor->responded_at = \Carbon\Carbon::now();
                }),

            \Tobyz\JsonApiServer\Endpoint\Delete::make()
                ->deleting(function (CoAuthor $coAuthor, \Tobyz\JsonApiServer\Context $context) {
                    $actor = $context->getActor();
                    $discussion = $coAuthor->discussion;

                    $canManage = $actor->can('manageCoAuthors', $discussion);
                    $isSelf = $actor->id === $coAuthor->user_id;

                    if (!$canManage && !$isSelf) {
                        throw new \Flarum\User\Exception\PermissionDeniedException();
                    }
                }),
        ];
    }
}
