import app from 'flarum/admin/app';
export { default as extend } from './extend';

app.initializers.add('tapao-co-authors', () => {
  app.extensionData
    .for('tapao-co-authors')
    .registerSetting({
      setting: 'tapao-co-authors.max_co_authors',
      type: 'number',
      label: app.translator.trans('tapao-co-authors.admin.settings.max_co_authors_label'),
      help: app.translator.trans('tapao-co-authors.admin.settings.max_co_authors_help'),
      default: 3,
    })
    .registerSetting({
      setting: 'tapao-co-authors.edit_rights',
      type: 'boolean',
      label: app.translator.trans('tapao-co-authors.admin.settings.edit_rights_label'),
      help: app.translator.trans('tapao-co-authors.admin.settings.edit_rights_help'),
      default: true,
    })
    .registerPermission(
      {
        icon: 'fas fa-user-friends',
        label: app.translator.trans('tapao-co-authors.admin.permissions.invite_co_authors_label'),
        permission: 'discussion.coWrite.invite',
      },
      'start'
    );
});
