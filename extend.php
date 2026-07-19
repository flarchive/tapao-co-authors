<?php

/*
 * This file is part of tapao/co-authors.
 *
 * Copyright (c) 2026 Tapao.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Tapao\CoAuthors;

use Flarum\Api\Resource\DiscussionResource;
use Flarum\Api\Resource\ForumResource;
use Flarum\Api\Schema\Boolean;
use Flarum\Api\Schema\Relationship\ToMany;
use Flarum\Discussion\Discussion;
use Flarum\Extend;
use Flarum\Post\Post;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),
        
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),
        
    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\Model(Discussion::class))
        ->relationship('coAuthors', function (Discussion $discussion) {
            return $discussion->hasMany(CoAuthor::class, 'discussion_id');
        }),

    (new Extend\ApiResource(DiscussionResource::class))
        ->fields(fn () => [
            ToMany::make('coAuthors')
                ->type('co_authors'),
            Boolean::make('canManageCoAuthors')
                ->get(fn (Discussion $discussion, $context) => $context->getActor()->can('manageCoAuthors', $discussion)),
        ]),

    (new Extend\ApiResource(ForumResource::class))
        ->fields(fn () => [
            Boolean::make('canCoWriteInvite')
                ->get(fn ($model, $context) => $context->getActor()->hasPermission('discussion.coWrite.invite')),
        ]),

    new Extend\ApiResource(Api\Resource\CoAuthorResource::class),

    (new Extend\ModelVisibility(CoAuthor::class))
        ->scope(Access\ScopeCoAuthorVisibility::class),

    (new Extend\Event())
        ->listen(\Flarum\Discussion\Event\Saving::class, Listener\SaveCoAuthorsToDiscussion::class),

    (new Extend\View())
        ->namespace('tapao-co-authors', __DIR__.'/views'),

    (new Extend\Notification())
        ->type(Notification\CoAuthorInvitedBlueprint::class, ['alert', 'email'], ['alert'])
        ->type(Notification\CoAuthorAddedBlueprint::class, ['alert', 'email'], ['alert']),

    (new Extend\Policy())
        ->modelPolicy(Discussion::class, Access\DiscussionPolicy::class)
        ->modelPolicy(Post::class, Access\PostPolicy::class),
];
