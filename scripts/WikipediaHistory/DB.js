define(["util", "ChromeHistory/DB", "ChromeHistory/HistoryQuery", "WikipediaHistory/Article", "WikipediaHistory/History", "WikipediaHistory/Visit", "libs/linq"], function (util, ChromeDB, HistoryQuery, Article, History, Visit) {
    var internals = new WeakMap();

    util.extend(DB, ChromeDB);

    function DB() {
        ChromeDB.call(this);

        internals.set(this, {
            articles: undefined
        });

        this.historyClass = History;
        this.visitClass = Visit;
    }

    DB.prototype.search = function (historyReadyCallback, visitsReadyCallback) {
        var beginningOfTime = (new Date(0)).getTime();
        var wikipedia = ".wikipedia.org/wiki/";

        var searchDetails = new HistoryQuery(wikipedia, beginningOfTime, undefined, 10000);

        ChromeDB.prototype.search.call(this, searchDetails, historyReadyCallback, visitsReadyCallback);
    };

    Object.defineProperty(DB.prototype, "articles", {
        get: function () {
            var me = internals.get(this);
            var that = this;

            if (!me.articles) {
                me.articles = Enumerable
                    .From(this.history)
                    .Distinct(function (historyItem) {
                        return historyItem.articleName;
                    })
                    .Select(function (historyItem) {
                        return new Article(that, historyItem.articleName);
                    })
                    .ToArray();
            }

            return me.articles;
        }
    });

    return DB;
});
