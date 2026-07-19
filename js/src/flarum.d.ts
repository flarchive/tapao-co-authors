declare const m: any;
declare module 'flarum/*';
declare module 'flarum/common/Model' {
    export default class Model {
        static attribute<T>(name: string, transform?: any): any;
        static hasOne<T>(name: string): any;
        static hasMany<T>(name: string): any;
        id(): string;
        exists: boolean;
        data: any;
        save(data?: any): Promise<any>;
        delete(): Promise<any>;
    }
}
declare module 'flarum/common/models/User' {
    import Model from 'flarum/common/Model';
    export default class User extends Model {
        displayName(): string;
    }
}
declare module 'flarum/common/models/Discussion' {
    import Model from 'flarum/common/Model';
    export default class Discussion extends Model {
        user(): any;
        coAuthors(): any;
        canManageCoAuthors(): boolean;
    }
}
declare module 'flarum/common/Component' {
    export default class Component<Attrs = any> {
        attrs: Attrs;
        constructor(attrs?: Attrs);
    }
}
declare module 'flarum/common/components/Modal' {
    import Component from 'flarum/common/Component';
    export default class Modal<Attrs = any> extends Component<Attrs> {
        oninit(vnode: any): void;
    }
}
declare module 'mithril' {
    const m: any;
    export default m;
}
