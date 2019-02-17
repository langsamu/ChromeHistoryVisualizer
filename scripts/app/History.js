var internals = new WeakMap;

export default class History {
    constructor(db, original) {
        internals.set(this, {
            db: db,
            id: original.id,
            url: original.url,
            title: original.title
        });
    }

    get id() {
        return internals.get(this).id;
    }

    get url() {
        return internals.get(this).url;
    }

    get title() {
        return internals.get(this).title;
    }

    get visits() {
        return internals.get(this).db.visits.byHistory.get(this.id);
    }

    get name() {
        if (this.url.contains(".wikipedia.org/wiki/")) {
            return decodeURI(this.url.split("/")[4]).replace(/_/g, " ");
        }

        if (this.url.contains("perhonen")) {
            const components = this.url.split("/");
            return components[components.length - 2];
        }

        if (!this.title) {
            return this.url;
        }

        return this.title;
    }

    get clusterKey() {
        const url = internals.get(this).url;
        return url.substringBefore("#");
    }
}
