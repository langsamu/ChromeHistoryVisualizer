define(["util", "ChromeHistory/History"], function (util, ChromeHistory) {
    var internals = new WeakMap();

    util.extend(History, ChromeHistory)

    function History(db, original) {
        ChromeHistory.call(this, db, original);

        internals.set(this, {
            articleName: undefined,
            article: undefined
        });
    }

    Object.defineProperty(History.prototype, "articleName", {
        get: function () {
            var me = internals.get(this);

            if (!me.articleName) {
                var pathComponents = this.url.pathname.split("/");

                // Ignore namespaced Wikipedia pages ie restrict to Main namespace (no prefix)
                //if (!article.match(/(File|Special|User|Wikipedia):/)) {
                me.articleName = decodeURI(pathComponents[2]).replace(/_/g, " ");
                //}
            }
            return me.articleName;
        }
    });

    Object.defineProperty(History.prototype, "article", {
        get: function () {
            var me = internals.get(this);

            if (!me.article) {
                me.article = this.db.articles
                    .filter(function (item) {
                        return item.name === this.articleName;
                    }, this)
                    [0];
            }
            return me.article;
        }
    });

    return History;
});
