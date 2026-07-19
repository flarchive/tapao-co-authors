{!! $translator->trans('tapao-co-authors.email.added.body', [
    '{recipient_display_name}' => $user->display_name,
    '{actor_display_name}' => $blueprint->getFromUser()->display_name,
    '{discussion_title}' => $blueprint->getSubject()->title,
    '{discussion_url}' => $url->to('forum')->route('discussion', ['id' => $blueprint->getSubject()->id])
]) !!}
