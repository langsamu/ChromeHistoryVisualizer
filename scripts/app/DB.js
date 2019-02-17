import "./utils.js";
import { default as History } from "./History.js";
import { default as Visit } from "./Visit.js";
import { default as VisitMap } from "./VisitMap.js";
import { default as HistoryQuery } from "./HistoryQuery.js";

var internals = new WeakMap;

export default class DB {
    constructor(queryText, doneCallback, progressCallback) {
        /// <field name="visits">Visits</field>
        /// <field name="history">History</field>

        internals.set(this, {
            history: new Map,
            visits: new VisitMap,
            progress: progressCallback || noOp,
            done: doneCallback || noOp
        });

        const query = new HistoryQuery(queryText);
        const callback = saveHistory.bind(this);

        chrome.history.search(query, callback);
    }

    get visits() {
        const me = internals.get(this);

        return me.visits;
    }

    get history() {
        const me = internals.get(this);

        return me.history;
    }
}

function noOp() { }
function normalize() {
    const visits = [...this.visits.values()];

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
    const me = internals.get(this);

    visits
        .map(original => new Visit(this, original))
        .forEach(visit => me.visits.set(visit.id, visit));

    if (isLast) {
        normalize.call(this);
        me.done(this);
    }
}
function getAndSaveVisits(lastHistoryIndex, query, historyIndex) {
    const isLast = historyIndex === lastHistoryIndex - 1;
    chrome.history.getVisits(query, saveVisits.bind(this, isLast));
}
function saveHistory(results) {
    const me = internals.get(this);

    results
        .map(convertTo.bind(this, History))
        .forEach(item => me.history.set(item.id, item));

    const lastHistoryIndex = me.history.size;
    const queries = [...me.history.values()]
        .map(item => ({ url: item.url }));

    queries.forEach(getAndSaveVisits.bind(this, lastHistoryIndex));
}
function convertTo(type, original) {
    return new type(this, original);
}
function addTo(map, item) {
    map.set(item.id, item);
}
