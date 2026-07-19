import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import avatar from 'flarum/common/helpers/avatar';
import username from 'flarum/common/helpers/username';
import app from 'flarum/forum/app';
import type Discussion from 'flarum/common/models/Discussion';
import type CoAuthor from '../../common/models/CoAuthor';
import type User from 'flarum/common/models/User';

export default class ManageCoAuthorsModal extends Modal {
  discussion!: Discussion;
  searchQuery = Stream('');
  searchResults: User[] = [];
  loading = false;
  dirty = false;
  attrs!: any;

  oninit(vnode: any) {
    super.oninit(vnode);
    this.discussion = this.attrs.discussion;
  }

  title() {
    return app.translator.trans('tapao-co-authors.forum.manage_modal.title');
  }

  className() {
    return 'ManageCoAuthorsModal Modal--small';
  }

  content() {
    const coAuthors = (this.discussion.coAuthors() || []) as CoAuthor[];
    
    return (
      <div className="Modal-body">
        <div className="CoAuthors-list" style="margin-bottom: 20px;">
          {coAuthors.map(ca => {
            const u = ca.user();
            if (!u) return null;
            return (
              <div className="CoAuthor-item" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <span style="display: flex; align-items: center; gap: 10px;">
                  {avatar(u)} {username(u)} 
                  <span className={`CoAuthor-status CoAuthor-status--${ca.status()}`}>
                    ({app.translator.trans(`tapao-co-authors.forum.manage_modal.status_${ca.status()}`)})
                  </span>
                </span>
                <Button 
                  className="Button Button--icon Button--danger" 
                  icon="fas fa-times" 
                  onclick={() => this.removeCoAuthor(ca)}
                />
              </div>
            );
          })}
        </div>
        <div className="CoAuthors-search">
          <input 
            className="FormControl"
            placeholder={app.translator.trans('tapao-co-authors.forum.manage_modal.search_placeholder')}
            bidi={this.searchQuery}
            oninput={(e: any) => {
              this.searchQuery(e.target.value);
              this.searchUsers();
            }}
          />
          {this.loading && <p>Loading...</p>}
          <ul className="CoAuthors-searchResults" style="list-style: none; padding: 0; margin-top: 10px;">
            {this.searchResults.map(u => (
              <li 
                style="padding: 10px; cursor: pointer; display: flex; align-items: center; gap: 10px; background: var(--control-bg); margin-bottom: 5px; border-radius: 4px;"
                onclick={() => this.addCoAuthor(u)}
              >
                {avatar(u)} {username(u)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  searchUsers() {
    const q = this.searchQuery();
    if (q.length < 2) {
      this.searchResults = [];
      return;
    }
    this.loading = true;
    app.store.find('users', { filter: { q }, page: { limit: 5 } }).then((results: any) => {
      this.searchResults = (results as User[]).filter(u => 
        u.id() !== this.discussion.user()?.id() &&
        !(this.discussion.coAuthors() || []).some((ca: CoAuthor) => ca.user()?.id() === u.id())
      );
      this.loading = false;
      m.redraw();
    });
  }

  addCoAuthor(user: User) {
    app.request({
      method: 'POST',
      url: `${app.forum.attribute('apiUrl')}/co_authors`,
      body: {
        data: {
          type: 'co_authors',
          relationships: {
            discussion: { data: { type: 'discussions', id: this.discussion.id() } },
            user: { data: { type: 'users', id: user.id() } }
          }
        }
      }
    }).then((res: any) => {
      app.store.pushPayload(res);
      this.searchQuery('');
      this.searchResults = [];
      this.dirty = true;
      m.redraw();
    });
  }

  removeCoAuthor(ca: CoAuthor) {
    if (confirm(app.translator.trans('tapao-co-authors.forum.manage_modal.remove_confirm') as string)) {
      ca.delete().then(() => {
        this.dirty = true;
        m.redraw();
      });
    }
  }
}
