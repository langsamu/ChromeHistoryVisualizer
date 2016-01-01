define(["ChromeHistory/History", "ChromeHistory/Visit"], function (History, Visit) {
    var internals = new WeakMap();

    function DB() {
        internals.set(this, {
            history: new Map,
            visits: new Map
        });
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

    DB.prototype.getAllHistory = function (callback) {
        var me = internals.get(this);
        var that = this;

        var details = {
            text: "",
            startTime: (new Date(0)).getTime(),
            endTime: (new Date()).getTime(),
            maxResults: 10000
        };

        chrome.history.search(details, process);

        function process(history) {
            var converted = history.map(convert);
            converted.forEach(push);

            if (callback) {
                callback(converted);
            }

            function convert(history) {
                return new History(that, history);
            }
            function push(item) {
                me.history.set(item.id, item);
            }
        }
    };

    DB.prototype.search = function (query) {
        return this.history.filter(test);

        function test(element) {
            return new RegExp(query).test(element.url.toString());
        }
    };

    DB.prototype.populateHistoryVisits = function (history, callback) {
        var me = internals.get(this);
        var that = this;

        history.forEach(function (item, index) {
            that.getVisits(item.url, gotVisits);

            function gotVisits(visits) {
                if (index === history.length - 1) {
                    if (callback) {
                        callback(history);
                    }
                }
            }
        });
    };

    DB.prototype.getVisits = function (url, callback) {
        var me = internals.get(this);
        var that = this;

        chrome.history.getVisits({ url: url.toString() }, gotVisits);

        function gotVisits(visits) {
            var converted = visits.map(convert);
            converted.forEach(push);

            if (callback) {
                callback(converted);

            }
            function convert(visit) {
                return new Visit(that, visit);
            }
            function push(item) {
                me.visits.set(item.id, item);
            }
        }
    };

    return DB;
});
