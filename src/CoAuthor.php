<?php

namespace Tapao\CoAuthors;

use Flarum\Database\AbstractModel;
use Flarum\Discussion\Discussion;
use Flarum\User\User;

/**
 * @property int $id
 * @property int $discussion_id
 * @property int $user_id
 * @property int|null $added_by_id
 * @property string $status
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon|null $responded_at
 * @property Discussion $discussion
 * @property User $user
 * @property User|null $addedBy
 */
class CoAuthor extends AbstractModel
{
    protected $table = 'discussion_co_authors';
    protected $dates = ['created_at', 'responded_at'];

    public static function build($discussionId, $userId, $addedById, $status = 'pending')
    {
        $coAuthor = new static();
        $coAuthor->discussion_id = $discussionId;
        $coAuthor->user_id = $userId;
        $coAuthor->added_by_id = $addedById;
        $coAuthor->status = $status;
        return $coAuthor;
    }

    public function discussion()
    {
        return $this->belongsTo(Discussion::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function (self $coAuthor) {
            $notificationSyncer = resolve(\Flarum\Notification\NotificationSyncer::class);

            if ($coAuthor->status === 'pending') {
                $notificationSyncer->sync(
                    new Notification\CoAuthorInvitedBlueprint($coAuthor),
                    [$coAuthor->user]
                );
            } elseif ($coAuthor->status === 'accepted') {
                $notificationSyncer->sync(
                    new Notification\CoAuthorAddedBlueprint($coAuthor),
                    [$coAuthor->user]
                );
            }
        });
        
        static::deleted(function (self $coAuthor) {
            $notificationSyncer = resolve(\Flarum\Notification\NotificationSyncer::class);
            $notificationSyncer->delete(new Notification\CoAuthorInvitedBlueprint($coAuthor));
            $notificationSyncer->delete(new Notification\CoAuthorAddedBlueprint($coAuthor));
        });
    }
}
