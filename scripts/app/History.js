define(function () {
    "use strict";

    var internals = new WeakMap;

    class History {
        constructor(db, original) {
            internals.set(this, {
                db: db,
                id: original.id,
                url: original.url,
                title: original.title,
            });
        }
    }

    Object.defineProperty(History.prototype, "id", {
        get: function () {
            return internals.get(this).id;
        }
    });

    Object.defineProperty(History.prototype, "url", {
        get: function () {
            return internals.get(this).url;
        }
    });

    Object.defineProperty(History.prototype, "title", {
        get: function () {
            return internals.get(this).title;
        }
    });

    Object.defineProperty(History.prototype, "visits", {
        get: function () {
            return internals.get(this).db.visits.byHistory.get(this.id);
        }
    });

    Object.defineProperty(History.prototype, "name", {
        get: function () {
            if (this.url.contains(".wikipedia.org/wiki/")) {
                return decodeURI(this.url.split("/")[4]).replace(/_/g, " ");
            }

            if (this.url.contains("perhonen")) {
                var components = this.url.split("/");
                return components[components.length - 2];
            }

            if (!this.title) {
                return this.url;
            }

            return this.title;
        }
    });

    Object.defineProperty(History.prototype, "clusterKey", {
        get: function () {
            var url = internals.get(this).url;
            return url.substringBefore("#");
        }
    });

    return History;
});