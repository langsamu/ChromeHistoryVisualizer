define(["History", "Visit", "VisitMap", "HistoryQuery"], (History, Visit, VisitMap, HistoryQuery) => {
    "use strict";

    var internals = new WeakMap;

    class DB {
        constructor(doneCallback, progressCallback) {
            /// <field name="visits">Visits</field>
            /// <field name="history">History</field>

            internals.set(this, {
                history: new Map,
                visits: new VisitMap,
                progress: progressCallback || noOp,
                done: doneCallback || noOp
            });

            var query = new HistoryQuery("wikipedia.org/wiki");
            var callback = saveHistory.bind(this);

            chrome.history.search(query, callback);
        }
    }

    Object.defineProperty(DB.prototype, "visits", {
        get: function () {
            var me = internals.get(this);

            return me.visits;
        }
    });
    Object.defineProperty(DB.prototype, "history", {
        get: function () {
            var me = internals.get(this);

            return me.history;
        }
    });

    function noOp() { };
    function normalize() {
        var visits = [...this.visits.values()];

        // 1. & 2. below mutually redundant

        // 1. Fakes
        // Create fake history for orphan visits
        this.history.set("FAKE", new History(this, { id: "FAKE", url: "FAKE", title: "FAKE" }));

        // Create fake visits attached to fake history for orphan visits
        visits
            .filter(v => v.parentId && !this.visits.has(v.parentId))
            .map(v => v.parentId)
            .distinct
            .forEach(pid => this.visits.set(pid, new Visit(this, { visitId: pid, id: "FAKE", referringVisitId: "0", visitTime: new Date(0) })));

        // 2. Clear
        // Set orphan visits to be root
        //visits
        //    .filter(v => !me.visits.has(v.parentId))
        //    .forEach(v => v.parentId = null);
    }
    function saveVisits(isLast, visits) {
        var me = internals.get(this);

        visits
            .map(original => new Visit(this, original))
            .forEach(visit => me.visits.set(visit.id, visit));

        if (isLast) {
            normalize.call(this);
            me.done.call(this);
        };
    }
    function getAndSaveVisits(lastHistoryIndex, query, historyIndex) {
        var isLast = historyIndex === lastHistoryIndex
        chrome.history.getVisits(query, saveVisits.bind(this, isLast));
    }
    function saveHistory(results) {
        var me = internals.get(this);

        results
            .map(convertTo.bind(this, History))
            .forEach(item => me.history.set(item.id, item));

        var lastHistoryIndex = me.history.size;
        var queries = [...me.history.values()]
            .map(item => ({ url: item.url }));

        queries.forEachAsync(getAndSaveVisits.bind(this, lastHistoryIndex), me.progress);
    }
    function convertTo(type, original) {
        return new type(this, original);
    }
    function addTo(map, item) {
        map.set(item.id, item);
    }

    return DB;
});