import "../../app/utils.js";

var internals = new WeakMap;

export default class Query extends HTMLElement {
    async connectedCallback() {
        const me = internals.set(this, {}).get(this);

        const response = await fetch("scripts/components/Query/index.html");

        const shadow = this.attachShadow({ mode: "closed" });
        shadow.innerHTML = await response.text();

        me.input = shadow.getElementById("input");
        me.input.addEventListener("input", onChange.bind(this));

        me.from = shadow.getElementById("from");
        me.from.addEventListener("input", onChange.bind(this));

        me.to = shadow.getElementById("to");
        me.to.addEventListener("input", onChange.bind(this));
    }

    get db() {
        const me = internals.get(this);

        return me.db;
    }
    set db(value) {
        const me = internals.get(this);

        me.db = value;

        const v = [...this.db.visits.values()].map(v => v.created.getTime()).distinct.sort();
        const first = v[1];
        const last = v.last;

        me.from.min = first;
        me.from.max = last;
        me.from.value = first;

        me.to.min = first;
        me.to.max = last;
        me.to.value = last;

        onChange.call(this);
    }

    get text() {
        const me = internals.get(this);

        return me.input.value;
    }
    set text(value) {
        const me = internals.get(this);

        me.input.value = value;

        onChange.call(this);
    }

    get results() {
        const me = internals.get(this);

        return me.results;
    }
}

function onChange() {
    const me = internals.get(this);

    const name = me.input.value;
    const from = new Date(Number(me.from.value));
    const to = new Date(Number(me.to.value));

    const isRoot = visit => visit.isRoot;
    const descendants = visit => visit.descendants.size;
    const descending = (a, b) => b - a;

    const interestingVisits = [...me.db.visits.values()]
        .filter(v => v.history.name.contains(name))
        .filter(v => v.created > from)
        .filter(v => v.created < to)
        .map(v => v.root)
        .distinct
        .orderBy(descendants, descending);

    me.results = new Set(interestingVisits);

    this.dispatchEvent(new Event("change"));
}

window.customElements.define("chromehistory-query", Query);
