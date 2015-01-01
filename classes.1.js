/// <reference path="chrome.intellisense.js" />
/// <reference path="util.js" />
/// <reference path="linq-vsdoc.js" />

(function () {
    "use strict";

    window.app = window.app || {};

    var HistoryDB = (function () {
        var _article, _history, _visit;

        return function () {
            var that = this;

            var rawVisits = [];
            var rawHistory = [];

            var beginningOfTime = (new Date(0)).getTime();
            var englishWikipedia = "://en.wikipedia.org/wiki/";

            var searchDetails = {
                text: englishWikipedia,
                startTime: beginningOfTime,
                maxResults: 10000
            };

            chrome.history.search(searchDetails, processHistory);

            function processHistory(historyItems) {
                rawHistory = historyItems;
                that.history.forEach(function (historyItem) {
                    chrome.history.getVisits({ url: historyItem.url.href }, function (visitItems) {
                        visitItems.forEach(function (visitItem) {
                            rawVisits.push(visitItem);
                        });
                    });
                });
            }

            Object.defineProperty(this, "article", {
                get: function () {
                    if (!_article) {
                        _article = Enumerable
                            .From(this.history)
                            .Distinct(function (historyItem) {
                                return historyItem.articleName;
                            })
                            .Select(function (historyItem) {
                                return new app.Article(that, historyItem.articleName);
                            })
                            .ToArray();
                    }
                    return _article;
                }
            });

            Object.defineProperty(this, "history", {
                get: function () {
                    if (!_history) {
                        var regex = new RegExp(escapeRegExp(englishWikipedia));

                        _history = rawHistory
                            .filter(function (historyItem) {
                                return regex.test(historyItem.url);
                            })
                            .map(function (historyItem) {
                                return new app.History(that, historyItem);
                            });
                    }
                    return _history;
                }
            });

            Object.defineProperty(this, "visit", {
                get: function () {
                    if (!_visit) {
                        _visit = rawVisits
                            .map(function (visitItem) {
                                return new app.Visit(that, visitItem)
                            });
                    }
                    return _visit;
                }
            });
        };
    })();
    app.HistoryDB = HistoryDB;

    var WikipediaHistoryDB = function () {
        HistoryDB.apply(this, arguments);


    };
    extend(WikipediaHistoryDB, HistoryDB);
    app.WikipediaHistoryDB = WikipediaHistoryDB;

    var DBObject = (function () {
        var _db;

        return function (db) {
            _db = db;

            Object.defineProperty(this, "db", {
                get: function () {
                    return _db;
                }
            });
        };
    })();

    var Article = function (db, original) {
        DBObject.apply(this, arguments);

        this.name = original;

        var _history;
        Object.defineProperty(this, "history", {
            get: function () {
                if (!_history) {
                    var that = this;

                    _history = this.db.history
                        .filter(function (item) {
                            return item.articleName === that.name;
                        });
                }
                return _history;
            }
        });

        var _visits;
        Object.defineProperty(this, "visits", {
            get: function () {
                if (!_visits) {
                    var that = this;

                    _visits = [];
                    this.history.forEach(function (historyItem) {
                        historyItem.visits.forEach(function (visit) {
                            _visits.push(visit);
                        })
                    });
                }
                return _visits;
            }
        });
    };
    extend(Article, DBObject);
    app.Article = Article;

    var History = function (db, original) {
        DBObject.apply(this, arguments);

        this.id = original.id;
        this.lastVisitTime = new Date(original.lastVisitTime);
        this.title = original.title;
        this.typedCount = original.typedCount;
        this.url = new URL(original.url);
        this.visitCount = original.visitCount;

        var _articleName;
        Object.defineProperty(this, "articleName", {
            get: function () {
                if (!_articleName) {
                    var pathComponents = this.url.pathname.split("/");

                    // Ignore namespaced Wikipedia pages ie restrict to Main namespace (no prefix)
                    //if (!article.match(/(File|Special|User|Wikipedia):/)) {
                    _articleName = decodeURI(pathComponents[2]).replace(/_/g, " ");
                    //}
                }
                return _articleName;
            }
        });

        var _article;
        Object.defineProperty(this, "article", {
            get: function () {
                if (!_article) {
                    var that = this;

                    _article = this.db.article
                        .filter(function (item) {
                            return item.name === that.articleName;
                        })
                        [0];
                }
                return _article;
            }
        });

        var _visits;
        Object.defineProperty(this, "visits", {
            get: function () {
                if (!_visits) {
                    var that = this;

                    _visits = this.db.visit
                        .filter(function (item) {
                            return item.id === that.id;
                        });
                }

                return _visits;
            }
        });
    };
    extend(History, DBObject);
    app.History = History;

    var Visit = function (db, original) {
        DBObject.apply(this, arguments);

        this.id = original.id;
        if (original.referringVisitId !== "0") {
            this.referringVisitId = original.referringVisitId;
        }
        this.transition = original.transition;
        this.visitId = original.visitId;
        this.visitTime = new Date(original.visitTime);

        var _history;
        Object.defineProperty(this, "history", {
            get: function () {
                if (!_history) {
                    var that = this;

                    _history = this.db.history
                        .filter(function (item) {
                            return item.id === that.id;
                        })
                        [0];
                }
                return _history;
            }
        });

        var _referringVisit;
        Object.defineProperty(this, "referringVisit", {
            get: function () {
                if (!_referringVisit) {
                    var that = this;

                    _referringVisit = this.db.visit
                        .filter(function (item) {
                            return item.visitId === that.referringVisitId;
                        })
                        [0];
                }
                return _referringVisit;
            }
        });

        var _referredVisits;
        Object.defineProperty(this, "referredVisits", {
            get: function () {
                if (!_referredVisits) {
                    var that = this;

                    _referredVisits = this.db.visit
                        .filter(function (item) {
                            return item.referringVisitId === that.visitId;
                        });
                }
                return _referredVisits;
            }
        });

        var _path;
        Object.defineProperty(this, "path", {
            get: function () {
                if (!_path) {
                    var referringVisit = this.referringVisit;

                    if (referringVisit) {
                        _path = [referringVisit].concat(referringVisit.path);
                    } else {
                        _path = [];
                    }
                }
                return _path;
            }
        });

        var _depth = null;
        Object.defineProperty(this, "depth", {
            get: function () {
                if (_depth === null) {
                    _depth = this.path.length;
                }
                return _depth;
            }
        });
    };
    extend(Visit, DBObject);
    app.Visit = Visit;
})();