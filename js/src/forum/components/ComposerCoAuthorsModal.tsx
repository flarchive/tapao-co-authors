import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import avatar from 'flarum/common/helpers/avatar';
import username from 'flarum/common/helpers/username';
import app from 'flarum/forum/app';
import type User from 'flarum/common/models/User';

export default class ComposerCoAuthorsModal extends Modal {
  searchQuery = Stream('');
  searchResults: User[] = [];
  loading = false;
  selectedUsers: User[] = [];
  attrs!: any;

  oninit(vnode: any) {
    super.oninit(vnode);
    this.selectedUsers = this.attrs.selectedUsers || [];
  }

  title() {
    return app.translator.trans('tapao-co-authors.forum.composer.modal_title');
  }

  className() {
    return 'ComposerCoAuthorsModal Modal--small';
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="CoAuthors-list" style="margin-bottom: 20px;">
          {this.selectedUsers.map(u => (
            <div className="CoAuthor-item" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <span style="display: flex; align-items: center; gap: 10px;">
                {avatar(u, { title: '' })} {username(u)}
              </span>
              <Button 
                className="Button Button--icon Button--danger" 
                icon="fas fa-times" 
                onclick={() => {
                  this.selectedUsers = this.selectedUsers.filter(user => user.id() !== u.id());
                  if (this.attrs.onchange) this.attrs.onchange(this.selectedUsers);
                }}
              />
            </div>
          ))}
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
                onclick={() => {
                  this.selectedUsers.push(u);
                  this.searchResults = [];
                  this.searchQuery('');
                  if (this.attrs.onchange) this.attrs.onchange(this.selectedUsers);
                }}
              >
                {avatar(u, { title: '' })} {username(u)}
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
        u.id() !== app.session.user?.id() &&
        !this.selectedUsers.some(su => su.id() === u.id())
      );
      this.loading = false;
      m.redraw();
    });
  }
}
