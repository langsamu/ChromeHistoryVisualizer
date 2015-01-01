/// <reference path="util.js" />
/// <reference path="chrome.intellisense.js" />
/// <reference path="linq-vsdoc.js" />

(function () {
    "use strict";

    window.ChromeHistory = window.ChromeHistory || {};

    var DB = (function () {
        var internals = new WeakMap();

        function DB() {
            internals.set(this, {
                rawHistory: undefined,
                history: undefined,
                rawVisits: undefined,
                visits: undefined
            });

            this.historyClass = History;
            this.visitClass = Visit;
        }

        Object.defineProperty(DB.prototype, "history", {
            get: function () {
                var me = internals.get(this);
                var that = this;

                if (!me.history) {
                    me.history = me.rawHistory.map(historySelector);
                }
                return me.history;

                function historySelector(item) {
                    return new that.historyClass(that, item);
                }
            }
        });

        Object.defineProperty(DB.prototype, "visits", {
            get: function () {
                var me = internals.get(this);
                var that = this;

                if (!me.visits) {
                    me.visits = me.rawVisits.map(visitSelector);
                }

                return me.visits;

                function visitSelector(item) {
                    return new that.visitClass(that, item)
                }
            }
        });

        Object.defineProperty(DB.prototype, "uniqueVisits", {
            get: function () {
                var me = internals.get(this);

                if (!me.uniqueVisits) {
                    var that = this;

                    me.uniqueVisits = Enumerable
                        .From(this.visits)
                        .GroupBy(function (item) {
                            return item.id + "-" + item.referringVisitId;
                        })
                        .Select(function (item) {
                            return item.source[0];
                        })
                        .ToArray()
                }

                return me.uniqueVisits;
            }
        });

        DB.prototype.search = function (details) {
            var me = internals.get(this);
            var that = this;

            chrome.history.search(details, processHistory);

            function processHistory(historyItems) {
                me.rawHistory = historyItems;
                me.history = undefined;

                that.history.forEach(processHistoryItem);

                function processHistoryItem(historyItem) {
                    var details = {
                        url: historyItem.url.href
                    };

                    me.rawVisits = [];
                    me.visits = undefined;

                    chrome.history.getVisits(details, processVisits);

                    function processVisits(visitItems) {
                        visitItems.forEach(pushVisit);

                        function pushVisit(visitItem) {
                            me.rawVisits.push(visitItem);
                        }
                    }
                }
            }
        };

        return DB;
    })();
    window.ChromeHistory.DB = DB;

    var DBObject = (function () {
        var internals = new WeakMap();

        function DBObject(db) {
            internals.set(this, {
                db: db
            });
        }

        Object.defineProperty(DBObject.prototype, "db", {
            get: function () {
                return internals.get(this).db;
            }
        });

        return DBObject;
    })();
    window.ChromeHistory.DBObject = DBObject;

    var History = (function (_super) {
        var internals = new WeakMap();

        extend(History, _super);

        function History(db, original) {
            _super.call(this, db)

            internals.set(this, {
                id: original.id,
                lastVisitTime: new Date(original.lastVisitTime),
                title: original.title,
                typedCount: original.typedCount,
                url: new URL(original.url),
                visitCount: original.visitCount,
                visits: undefined
            });
        }

        Object.defineProperty(History.prototype, "id", {
            get: function () {
                var me = internals.get(this);

                return me.id;
            }
        });

        Object.defineProperty(History.prototype, "lastVisitTime", {
            get: function () {
                var me = internals.get(this);

                return me.lastVisitTime;
            }
        });

        Object.defineProperty(History.prototype, "title", {
            get: function () {
                var me = internals.get(this);

                return me.title;
            }
        });

        Object.defineProperty(History.prototype, "typedCount", {
            get: function () {
                var me = internals.get(this);

                return me.typedCount;
            }
        });

        Object.defineProperty(History.prototype, "url", {
            get: function () {
                var me = internals.get(this);

                return me.url;
            }
        });

        Object.defineProperty(History.prototype, "visitCount", {
            get: function () {
                var me = internals.get(this);

                return me.visitCount;
            }
        });

        Object.defineProperty(History.prototype, "visits", {
            get: function () {
                var me = internals.get(this);

                if (!me.visits) {
                    var that = this;

                    me.visits = this.db.visits
                        .filter(function (visit) {
                            return visit.id === that.id;
                        });
                }

                return me.visits;
            }
        });

        return History;
    })(DBObject);
    window.ChromeHistory.History = History;

    var Visit = (function (_super) {
        var internals = new WeakMap();

        extend(Visit, _super);

        function Visit(db, original) {
            _super.call(this, db);

            internals.set(this, {
                id: original.id,
                referringVisitId: original.referringVisitId,
                transition: original.transition,
                visitId: original.visitId,
                visitTime: new Date(original.visitTime),
                history: undefined
            });
        }

        Object.defineProperty(Visit.prototype, "id", {
            get: function () {
                var me = internals.get(this);

                return me.id;
            }
        });

        Object.defineProperty(Visit.prototype, "referringVisitId", {
            get: function () {
                var me = internals.get(this);

                return me.referringVisitId === "0" ? undefined : me.referringVisitId;
            }
        });

        Object.defineProperty(Visit.prototype, "transition", {
            get: function () {
                var me = internals.get(this);

                return me.transition;
            }
        });

        Object.defineProperty(Visit.prototype, "visitId", {
            get: function () {
                var me = internals.get(this);

                return me.visitId;
            }
        });

        Object.defineProperty(Visit.prototype, "visitTime", {
            get: function () {
                var me = internals.get(this);

                return me.visitTime;
            }
        });

        Object.defineProperty(Visit.prototype, "history", {
            get: function () {
                var me = internals.get(this);

                if (!me.history) {
                    var that = this;

                    me.history = this.db.history
                        .filter(function (item) {
                            return item.id === that.id;
                        })
                        [0];
                }

                return me.history;
            }
        });

        // TODO: doeasn't consider uniqueness
        Object.defineProperty(Visit.prototype, "referringVisit", {
            get: function () {
                var me = internals.get(this);

                if (!me.referringVisit) {
                    var that = this;

                    me.referringVisit = this.db.visits
                        .filter(function (item) {
                            return item.visitId === that.referringVisitId;
                        })
                        [0];
                }

                return me.referringVisit;
            }
        });

        Object.defineProperty(Visit.prototype, "referredVisits", {
            get: function () {
                var me = internals.get(this);

                if (!me.referredVisits) {
                    var that = this;

                    me.referredVisits = this.db.visits
                        .filter(function (item) {
                            return item.referringVisitId === that.visitId;
                        });
                }

                return me.referredVisits;
            }
        });

        Object.defineProperty(Visit.prototype, "uniqueReferredVisits", {
            get: function () {
                var me = internals.get(this);

                if (!me.uniqueReferredVisits) {
                    var that = this;

                    me.uniqueReferredVisits = Enumerable
                        .From(this.db.visits)
                        .Where(function (item) {
                            return item.referringVisitId === that.referringVisitId && item.id === that.id; // share referring visit and history item
                        })
                        .SelectMany(function (item) {
                            return item.referredVisits;
                        })
                        .GroupBy(function (item) {
                            return item.id;
                        })
                        .Select(function (item) {
                            return item.source[0];
                        })
                        .ToArray()


                }

                return me.uniqueReferredVisits;
            }
        });

        // TODO: doeasn't consider uniqueness
        Object.defineProperty(Visit.prototype, "path", {
            get: function () {
                var me = internals.get(this);

                if (!me.path) {
                    if (this.referringVisit) {
                        me.path = [this.referringVisit].concat(this.referringVisit.path);
                    } else {
                        me.path = [];
                    }
                }

                return me.path;
            }
        });

        // TODO: doeasn't consider uniqueness
        Object.defineProperty(Visit.prototype, "depth", {
            get: function () {
                var me = internals.get(this);

                if (isNaN(me.depth)) {
                    me.depth = this.path.length;
                }

                return me.depth;
            }
        });

        return Visit;
    })(DBObject);
    window.ChromeHistory.Visit = Visit;
})();
(function () {
    "use strict";

    window.WikipediaHistory = window.WikipediaHistory || {};

    var DB = (function (_super) {
        var internals = new WeakMap();

        extend(DB, _super);

        function DB() {
            _super.call(this);

            internals.set(this, {
                articles: undefined
            });

            this.historyClass = History;
            this.visitClass = Visit;

            var beginningOfTime = (new Date(0)).getTime();
            var englishWikipedia = ".wikipedia.org/wiki/";

            var searchDetails = {
                text: englishWikipedia,
                startTime: beginningOfTime,
                maxResults: 10000
            };

            this.search(searchDetails);
        }

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
    })(window.ChromeHistory.DB);
    window.WikipediaHistory.DB = DB;

    var Article = (function (_super) {
        var internals = new WeakMap();

        extend(Article, _super);

        function Article(db, name) {
            _super.call(this, db);

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
                    var that = this;

                    me.history = this.db.history
                        .filter(function (item) {
                            return item.articleName === that.name;
                        });
                }

                return me.history;
            }
        });

        return Article;
    })(window.ChromeHistory.DBObject);
    window.WikipediaHistory.Article = Article;

    var History = (function (_super) {
        var internals = new WeakMap();

        extend(History, _super)

        function History(db, original) {
            _super.call(this, db, original);

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
                    var that = this;

                    me.article = this.db.articles
                        .filter(function (item) {
                            return item.name === that.articleName;
                        })
                        [0];
                }
                return me.article;
            }
        });

        return History;
    })(window.ChromeHistory.History);
    window.WikipediaHistory.History = History;

    var Visit = (function (_super) {
        var internals = new WeakMap();

        extend(Visit, _super);

        function Visit(db, original) {
            _super.call(this, db, original);

            internals.set(this, {
                uniqueNoRedirectReferredVisits: undefined
            });
        }

        Object.defineProperty(Visit.prototype, "uniqueNoRedirectReferredVisits", {
            get: function () {
                var me = internals.get(this);

                if (!me.uniqueNoRedirectReferredVisits) {
                    var that = this;

                    me.uniqueNoRedirectReferredVisits = Enumerable
                        .From(this.uniqueReferredVisits)
                        .GroupBy(function (item) {
                            return Math.floor(item.visitTime / 2000);
                        })
                        .Select(function (item) {
                            return item.source[0];
                        })
                        .ToArray();
                }

                return me.uniqueNoRedirectReferredVisits;
            }
        });

        Object.defineProperty(Visit.prototype, "descendants", {
            get: function () {
                var me = internals.get(this);

                if (!me.descendants) {
                    var result = [];

                    this.uniqueNoRedirectReferredVisits.forEach(function (item) {
                        result.push(item);
                        result = result.concat(item.descendants);
                    });

                    me.descendants = result;
                }

                return me.descendants;
            }
        });

        return Visit;
    })(window.ChromeHistory.Visit);
    window.WikipediaHistory.Visit = Visit;
})();
