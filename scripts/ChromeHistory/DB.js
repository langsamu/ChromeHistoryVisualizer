define(["ChromeHistory/History", "ChromeHistory/Visit", "libs/linq"], function (History, Visit) {
    var internals = new WeakMap();

    function DB() {
        internals.set(this, {
            history: new Map(),
            visits: new Map()
        });

        this.historyClass = History;
        this.visitClass = Visit;
    }

    Object.defineProperty(DB.prototype, "history", {
        get: function () {
            var me = internals.get(this);

            var result = [];

            me.history.forEach(function (item) {
                result.push(item);
            });

            return result;
        }
    });

    Object.defineProperty(DB.prototype, "visits", {
        get: function () {
            var me = internals.get(this);

            var result = [];

            me.visits.forEach(function (item) {
                result.push(item);
            });

            return result;
        }
    });

    Object.defineProperty(DB.prototype, "uniqueVisits", {
        get: function () {
            var me = internals.get(this);

            if (!me.uniqueVisits) {
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

    DB.prototype.getVisits = function (url, callback) {
        var me = internals.get(this);
        var that = this;

        var details = {
            url: url
        };

        chrome.history.getVisits(details, process);

        function process(visits) {
            var converted = visits.map(convert);
            converted.filter(isNew).forEach(push);

            if (callback) {
                callback.call(that, converted);
            }

            function isNew(visit) {
                return !me.visits.has(visit.id);
            }
            function convert(visit) {
                return new that.visitClass(that, visit);
            }
            function push(visit) {
                me.visits.set(visit.id, visit);
            }
        }
    };
    DB.prototype.getHistory = function (details, callback) {
        var me = internals.get(this);
        var that = this;

        chrome.history.search(details, process);

        function process(history) {
            var converted = history.map(convert);
            converted.filter(isNew).forEach(push);

            if (callback) {
                callback.call(that, converted);
            }

            function isNew(item) {
                return !me.history.has(item.id);
            }
            function convert(history) {
                return new that.historyClass(that, history);
            }
            function push(item) {
                me.history.set(item.id, item);
            }
        }
    };
    DB.prototype.getHistoryAndVisits = function (details, historyCallback, visitsCallback) {
        var that = this;

        this.getHistory(details, historyReady);

        function historyReady(history) {
            var historyOutstanding = 0;

            if (historyCallback) {
                historyCallback.call(that, history);
            }

            var allVisits = [];

            history.forEach(process);

            function process(item) {
                historyOutstanding++;

                that.getVisits(item.url.href, visitsReady);

                function visitsReady(visits) {
                    visits.forEach(function (item) { allVisits.push(item); });

                    historyOutstanding--;

                    if (!historyOutstanding) {
                        if (visitsCallback) {
                            visitsCallback.call(that, allVisits);
                        }
                    }
                }
            }
        }
    };


    //TODO: callback
    DB.prototype.deleteHistory = function (history,callback) {
        var that = this;

        chrome.history.deleteUrl({ url: history.url.href }, function () {
            var me = internals.get(that);

            me.history.delete(history.id);

            if (callback) {
                callback.call(that);
            }
        });
    };

    return DB;
});
