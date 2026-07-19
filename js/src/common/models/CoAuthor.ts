import Model from 'flarum/common/Model';
import User from 'flarum/common/models/User';
import Discussion from 'flarum/common/models/Discussion';

export default class CoAuthor extends Model {
  status() {
    return Model.attribute<string>('status').call(this);
  }

  createdAt() {
    return Model.attribute('createdAt', Model.transformDate).call(this);
  }

  respondedAt() {
    return Model.attribute('respondedAt', Model.transformDate).call(this);
  }

  user() {
    return Model.hasOne<User>('user').call(this);
  }

  discussion() {
    return Model.hasOne<Discussion>('discussion').call(this);
  }

  addedBy() {
    return Model.hasOne<User>('addedBy').call(this);
  }

  apiEndpoint() {
    return '/co_authors' + (this.exists ? '/' + this.data.id : '');
  }
}
