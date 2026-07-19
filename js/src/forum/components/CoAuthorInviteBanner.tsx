import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import app from 'flarum/forum/app';
import type CoAuthor from '../../common/models/CoAuthor';

export interface CoAuthorInviteBannerAttrs {
  coAuthor: CoAuthor;
}

export default class CoAuthorInviteBanner extends Component<CoAuthorInviteBannerAttrs> {
  attrs!: CoAuthorInviteBannerAttrs;
  view() {
    const ca = this.attrs.coAuthor;
    const addedBy = ca.addedBy();
    return (
      <div className="CoAuthorInviteBanner" style="background: var(--alert-bg, #fff3cd); color: var(--alert-color, #856404); padding: 10px 15px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border: 1px solid var(--alert-border, #ffeeba);">
        <span>{app.translator.trans('tapao-co-authors.forum.banner.invited_text', { user: addedBy ? addedBy.displayName() : 'Someone' })}</span>
        <div style="display: flex; gap: 10px;">
          <Button className="Button Button--primary" onclick={() => this.accept(ca)}>
            {app.translator.trans('tapao-co-authors.forum.banner.accept')}
          </Button>
          <Button className="Button Button--danger" onclick={() => this.decline(ca)}>
            {app.translator.trans('tapao-co-authors.forum.banner.decline')}
          </Button>
        </div>
      </div>
    );
  }

  accept(ca: CoAuthor) {
    ca.save({ status: 'accepted' }).then(() => m.redraw());
  }

  decline(ca: CoAuthor) {
    ca.delete().then(() => m.redraw());
  }
}
