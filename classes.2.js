/// <reference path="chrome.intellisense.js" />
/// <reference path="util.js" />
/// <reference path="linq-vsdoc.js" />

(function () {
    "use strict";

    // TODO: rename
    // TODO: add namespaces
    window.app = window.app || {};

    var HistoryDB = (function () {
        var _history;
        var _visits;
        var rawHistory;
        var rawVisits;

        function HistoryDB() {
            Object.defineProperty(this, "history", {
                get: function () {
                    var that = this;

                    if (!_history) {
                        _history = rawHistory.map(historySelector);
                    }
                    return _history;

                    function historySelector(item) {
                        return new that.historyClass(that, item);
                    }
                }
            });

            Object.defineProperty(this, "visits", {
                get: function () {
                    var that = this;

                    if (!_visits) {
                        _visits = rawVisits.map(visitSelector);
                    }
                    return _visits;

                    function visitSelector(item) {
                        return new that.visitClass(that, item)
                    }
                }
            });
        }

        HistoryDB.prototype.search = function (searchDetails) {
            var that = this;
            chrome.history.search(searchDetails, processHistory);

            function processHistory(historyItems) {
                _history = null;
                rawHistory = historyItems;

                that.history.forEach(processHistoryItem);

                function processHistoryItem(historyItem) {
                    var details = {
                        url: historyItem.url.href
                    };

                    _visits = null;
                    rawVisits = [];

                    chrome.history.getVisits(details, processVisits);

                    function processVisits(visitItems) {
                        visitItems.forEach(pushVisit);

                        function pushVisit(visitItem) {
                            rawVisits.push(visitItem);
                        }
                    }
                }
            }
        };

        Object.defineProperty(HistoryDB.prototype, "historyClass", { get: function () { return app.History; } });
        Object.defineProperty(HistoryDB.prototype, "visitClass", { get: function () { return app.Visit; } });

        return HistoryDB;
    })();
    app.HistoryDB = HistoryDB;

    var WikipediaHistoryDB = (function (_super) {
        extend(WikipediaHistoryDB, _super);

        function WikipediaHistoryDB() {
            _super.apply(this, arguments);

            var beginningOfTime = (new Date(0)).getTime();
            var englishWikipedia = "://en.wikipedia.org/wiki/";

            var searchDetails = {
                text: englishWikipedia,
                startTime: beginningOfTime,
                maxResults: 10000
            };

            this.search(searchDetails);
        }

        Object.defineProperty(WikipediaHistoryDB.prototype, "articles", {
            get: function () {
                var that = this;

                if (!this._articles) {
                    this._articles = Enumerable
                        .From(this.history)
                        .Distinct(function (historyItem) {
                            return historyItem.articleName;
                        })
                        .Select(function (historyItem) {
                            return new app.WikipediaArticle(that, historyItem.articleName);
                        })
                        .ToArray();
                }

                return this._articles;
            }
        });

        Object.defineProperty(WikipediaHistoryDB.prototype, "historyClass", {
            get: function () {
                return app.WikipediaHistory;
            }
        });

        Object.defineProperty(WikipediaHistoryDB.prototype, "visitClass", {
            get: function () {
                return app.WikipediaVisit;
            }
        });

        return WikipediaHistoryDB;
    })(HistoryDB);
    app.WikipediaHistoryDB = WikipediaHistoryDB;

    var DBObject = (function () {
        var _db;

        function DBObject(db) {
            Object.defineProperty(this, "db", {
                get: function () {
                    return db;
                }
            });
        }

        return DBObject;
    })();

    var History = (function (_super) {
        extend(History, _super);

        function History(db, original) {
            _super.apply(this, arguments);

            this.id = original.id;
            this.lastVisitTime = new Date(original.lastVisitTime);
            this.title = original.title;
            this.typedCount = original.typedCount;
            this.url = new URL(original.url);
            this.visitCount = original.visitCount;
        }

        Object.defineProperty(History.prototype, "visits", {
            get: function () {
                if (!this._visits) {
                    var that = this;

                    this._visits = this.db.visits
                        .filter(function (item) {
                            return item.id === that.id;
                        });
                }

                return this._visits;
            }
        });

        return History;
    })(DBObject);
    app.History = History;

    var Visit = (function (_super) {
        extend(Visit, _super);

        function Visit(db, original) {
            _super.apply(this, arguments);

            this.id = original.id;
            if (original.referringVisitId !== "0") {
                this.referringVisitId = original.referringVisitId;
            }
            this.transition = original.transition;
            this.visitId = original.visitId;
            this.visitTime = new Date(original.visitTime);
        }

        Object.defineProperty(Visit.prototype, "history", {
            get: function () {
                if (!this._history) {
                    var that = this;

                    this._history = this.db.history
                        .filter(function (item) {
                            return item.id === that.id;
                        })
                        [0];
                }
                return this._history;
            }
        });

        Object.defineProperty(Visit.prototype, "referringVisit", {
            get: function () {
                if (!this._referringVisit) {
                    var that = this;

                    this._referringVisit = this.db.visits
                        .filter(function (item) {
                            return item.visitId === that.referringVisitId;
                        })
                        [0];
                }
                return this._referringVisit;
            }
        });

        Object.defineProperty(Visit.prototype, "referredVisits", {
            get: function () {
                if (!this._referredVisits) {
                    var that = this;

                    this._referredVisits = this.db.visits
                        .filter(function (item) {
                            return item.referringVisitId === that.visitId;
                        });
                }
                return this._referredVisits;
            }
        });

        Object.defineProperty(Visit.prototype, "uniqueReferredVisits", {
            get: function () {
                if (!this._uniqueReferredVisits) {
                    var that = this;

                    this._uniqueReferredVisits = Enumerable
                        .From(this.db.visits)
                        .Where(function (item) {
                            return item.referringVisitId === that.referringVisitId && item.id === that.id;
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

                        // TODO: move to WikipediaVisit
                        // Cluster by visit time to eliminate redirects
                        .GroupBy(function (item) {
                            return Math.floor(item.visitTime / 2000);
                        })
                        .Select(function (item) {
                            return item.source[0];
                        })

                        .ToArray()


                }

                return this._uniqueReferredVisits;
            }
        });

        Object.defineProperty(Visit.prototype, "path", {
            get: function () {
                if (!this._path) {
                    if (this.referringVisit) {
                        this._path = [this.referringVisit].concat(this.referringVisit.path);
                    } else {
                        this._path = [];
                    }
                }

                return this._path;
            }
        });

        Object.defineProperty(Visit.prototype, "depth", {
            get: function () {
                if (isNaN(this._depth)) {
                    this._depth = this.path.length;
                }
                return this._depth;
            }
        });

        return Visit;
    })(DBObject);
    app.Visit = Visit;

    var WikipediaHistory = (function (_super) {
        extend(WikipediaHistory, _super)

        function WikipediaHistory() {
            _super.apply(this, arguments);
        }

        Object.defineProperty(WikipediaHistory.prototype, "articleName", {
            get: function () {
                if (!this._articleName) {
                    var pathComponents = this.url.pathname.split("/");

                    // Ignore namespaced Wikipedia pages ie restrict to Main namespace (no prefix)
                    //if (!article.match(/(File|Special|User|Wikipedia):/)) {
                    this._articleName = decodeURI(pathComponents[2]).replace(/_/g, " ");
                    //}
                }
                return this._articleName;
            }
        });

        Object.defineProperty(WikipediaHistory.prototype, "article", {
            get: function () {
                if (!this._article) {
                    var that = this;

                    this._article = this.db.articles
                        .filter(function (item) {
                            return item.name === that.articleName;
                        })
                        [0];
                }
                return this._article;
            }
        });

        return WikipediaHistory;
    })(History);
    app.WikipediaHistory = WikipediaHistory;

    var WikipediaVisit = (function (_super) {
        extend(WikipediaVisit, _super);

        function WikipediaVisit(db, original) {
            _super.apply(this, arguments);
        }

        return WikipediaVisit;
    })(Visit);
    app.WikipediaVisit = WikipediaVisit;

    var WikipediaArticle = (function (_super) {
        extend(WikipediaArticle, _super);

        function WikipediaArticle(db, original) {
            _super.apply(this, arguments);

            this.name = original;
        }

        Object.defineProperty(WikipediaArticle.prototype, "history", {
            get: function () {
                if (!this._history) {
                    var that = this;

                    this._history = this.db.history
                        .filter(function (item) {
                            return item.articleName === that.name;
                        });
                }
                return this._history;
            }
        });

        return WikipediaArticle;
    })(DBObject);
    app.WikipediaArticle = WikipediaArticle;
})();