import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import avatar from 'flarum/common/helpers/avatar';
import Tooltip from 'flarum/common/components/Tooltip';
import type Discussion from 'flarum/common/models/Discussion';
import type User from 'flarum/common/models/User';
import type CoAuthor from '../../common/models/CoAuthor';

export interface CoAuthorBylineAttrs {
  discussion: Discussion;
}

export default class CoAuthorByline extends Component<CoAuthorBylineAttrs> {
  attrs!: CoAuthorBylineAttrs;
  view() {
    const discussion = this.attrs.discussion;
    const author = discussion.user();
    const coAuthors = (discussion.coAuthors() || []) as CoAuthor[];

    // Only display accepted co-authors publicly
    const acceptedCoAuthors = coAuthors.filter((ca) => ca.status() === 'accepted');

    if (!acceptedCoAuthors.length) {
      return (
        <span className="DiscussionListItem-author" title={author ? author.displayName() : ''}>
          {avatar(author, { title: '' })}
        </span>
      );
    }

    const allAuthors = [author, ...acceptedCoAuthors.map((ca) => ca.user())].filter(Boolean) as User[];
    
    // Fallback to 3 if setting is not loaded
    const maxSetting = app.forum.attribute('tapao-co-authors.max_co_authors') as string;
    const maxCoAuthors = parseInt(maxSetting || '3', 10);
    
    const displayed = allAuthors.slice(0, maxCoAuthors);
    const remaining = allAuthors.length - displayed.length;

    return (
      <span className="DiscussionListItem-author CoAuthorsByline">
        <ul className="CoAuthorsByline-avatars">
          {displayed.map((u) => (
            <li className="CoAuthorsByline-avatar">
              <Tooltip text={u.displayName()}>
                {avatar(u, { title: '' })}
              </Tooltip>
            </li>
          ))}
          {remaining > 0 && (
            <li className="CoAuthorsByline-avatar CoAuthorsByline-more">
              <Tooltip text={`+${remaining} more`}>
                <span>+{remaining}</span>
              </Tooltip>
            </li>
          )}
        </ul>
      </span>
    );
  }
}
