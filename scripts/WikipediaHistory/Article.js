define(["util", "ChromeHistory/DBObject"], function (util, DBObject) {
    var internals = new WeakMap();

    util.extend(Article, DBObject);

    function Article(db, name) {
        DBObject.call(this, db);

        internals.set(this, {
            name: name
        });
    }

    Object.defineProperty(Article.prototype, "name", {
        get: function () {
            var me = internals.get(this);

            return me.name;
        }
    });

    Object.defineProperty(Article.prototype, "history", {
        get: function () {
            var me = internals.get(this);

            if (!me.history) {
                me.history = this.db.history
                    .filter(function (item) {
                        return item.articleName === this.name;
                    }, this);
            }

            return me.history;
        }
    });

    return Article;
});
