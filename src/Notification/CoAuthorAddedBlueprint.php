<?php

namespace Tapao\CoAuthors\Notification;

use Flarum\Database\AbstractModel;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\User\User;
use Tapao\CoAuthors\CoAuthor;
use Symfony\Contracts\Translation\TranslatorInterface;

class CoAuthorAddedBlueprint implements BlueprintInterface, MailableInterface
{
    public $coAuthor;

    public function __construct(CoAuthor $coAuthor)
    {
        $this->coAuthor = $coAuthor;
    }

    public function getSubject(): ?AbstractModel
    {
        return $this->coAuthor->discussion;
    }

    public function getFromUser(): ?User
    {
        return $this->coAuthor->addedBy;
    }

    public function getData(): mixed
    {
        return null;
    }

    public static function getType(): string
    {
        return 'coAuthorAdded';
    }

    public static function getSubjectModel(): string
    {
        return \Flarum\Discussion\Discussion::class;
    }

    public function getEmailView(): array
    {
        return ['text' => 'tapao-co-authors::emails.coAuthorAdded'];
    }

    public function getEmailSubject(TranslatorInterface $translator): string
    {
        return $translator->trans('tapao-co-authors.email.added.subject', [
            '{display_name}' => $this->coAuthor->addedBy->display_name,
            '{title}' => $this->coAuthor->discussion->title
        ]);
    }
}
