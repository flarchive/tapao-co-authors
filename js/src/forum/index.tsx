import app from 'flarum/forum/app';
import Model from 'flarum/common/Model';
import Discussion from 'flarum/common/models/Discussion';
import CoAuthor from '../common/models/CoAuthor';
import { extend } from 'flarum/common/extend';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import CoAuthorByline from './components/CoAuthorByline';
import DiscussionHero from 'flarum/forum/components/DiscussionHero';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';
import Button from 'flarum/common/components/Button';
import CoAuthorInviteBanner from './components/CoAuthorInviteBanner';
import ManageCoAuthorsModal from './components/ManageCoAuthorsModal';
import Stream from 'flarum/common/utils/Stream';
import ComposerCoAuthorsModal from './components/ComposerCoAuthorsModal';
// @ts-ignore
const DiscussionComposer = flarum.core.compat['forum/components/DiscussionComposer'] || require('flarum/forum/components/DiscussionComposer').default;

export { default as extend } from './extend';

app.initializers.add('tapao-co-authors', () => {
  app.store.models.co_authors = CoAuthor;

  Discussion.prototype.coAuthors = Model.hasMany('coAuthors');
  Discussion.prototype.canManageCoAuthors = Model.attribute<boolean>('canManageCoAuthors');

  extend(DiscussionListItem.prototype, 'view', function (this: any, vdom: any) {
    if (!vdom) return;
    const discussion = this.attrs.discussion;
    const walk = (node: any) => {
      if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node && node.attrs && typeof node.attrs.className === 'string' && node.attrs.className.includes('DiscussionListItem-author')) {
        node.children = [<CoAuthorByline discussion={discussion} />];
      } else if (node && node.children) {
        walk(node.children);
      }
    };
    walk(vdom);
  });

  extend(DiscussionHero.prototype, 'items', function (this: any, items: any) {
    const discussion = this.attrs.discussion;
    const coAuthors = (discussion.coAuthors() || []) as CoAuthor[];
    const pendingInvite = coAuthors.find(ca => ca.user()?.id() === app.session.user?.id() && ca.status() === 'pending');
    
    if (pendingInvite) {
      items.add('coAuthorInvite', <CoAuthorInviteBanner coAuthor={pendingInvite} />, 100);
    }
  });

  extend(DiscussionControls, 'moderationControls', function (items: any, discussion: any) {
    if (discussion.canManageCoAuthors()) {
      items.add(
        'manageCoAuthors',
        <Button icon="fas fa-user-friends" onclick={() => app.modal.show(ManageCoAuthorsModal, { discussion })}>
          {app.translator.trans('tapao-co-authors.forum.discussion_controls.manage_co_authors_button')}
        </Button>
      );
    }
  });

  extend(DiscussionComposer.prototype, 'oninit', function (this: any) {
    this.composerCoAuthors = Stream([]);
  });

  extend(DiscussionComposer.prototype, 'headerItems', function (this: any, items: any) {
    if (app.forum.attribute('canCoWriteInvite')) {
      items.add(
        'coAuthors',
        <a 
          className="DiscussionComposer-coAuthors" 
          onclick={() => {
            app.modal.show(ComposerCoAuthorsModal, {
              selectedUsers: this.composerCoAuthors(),
              onchange: (users: any) => {
                this.composerCoAuthors(users);
                m.redraw();
              }
            });
          }}
        >
          <span className="fas fa-user-friends"></span>{' '}
          {app.translator.trans('tapao-co-authors.forum.composer.add_co_authors', { count: this.composerCoAuthors().length })}
        </a>
      );
    }
  });

  extend(DiscussionComposer.prototype, 'data', function (this: any, data: any) {
    if (this.composerCoAuthors() && this.composerCoAuthors().length) {
      data.relationships = data.relationships || {};
      data.relationships.coAuthors = {
        data: this.composerCoAuthors().map((u: any) => ({ type: 'users', id: u.id() }))
      };
    }
  });
});
