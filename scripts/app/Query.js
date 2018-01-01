define(["EventTarget", "utils"], function (EventTarget) {
    "use strict";

    var internals = new WeakMap;

    class Query extends EventTarget {
        constructor(container, db) {
            super();

            var me = {
                db: db
            };

            internals.set(this, me);

            me.input = document.createElement("input");
            me.input.controller = this;
            container.appendChild(me.input);

            me.input.addEventListener("input", onChange.bind(this));

            var v = [...db.visits.values()].map(v => v.created.getTime()).distinct.sort();
            var first = v[1];
            var last = v.last;

            me.from = document.createElement("input");
            me.from.controller = this;
            me.from.type = "range";
            me.from.step = 1000 * 60 * 60;
            me.from.min = first;
            me.from.max = last;
            me.from.value = first;
            container.appendChild(me.from);
            me.from.addEventListener("input", onChange.bind(this));

            me.to = document.createElement("input");
            me.to.controller = this;
            me.to.type = "range";
            me.to.step = 1000 * 60 * 60;
            me.to.min = first;
            me.to.max = last;
            me.to.value = last;
            container.appendChild(me.to);
            me.to.addEventListener("input", onChange.bind(this));
        }
    }

    Object.defineProperty(Query.prototype, "text", {
        get: function () {
            return internals.get(this).input.value;
        },
        set: function (value) {
            internals.get(this).input.value = value;

            onChange.call(this);
        }
    });

    Object.defineProperty(Query.prototype, "results", {
        get: function () {
            return internals.get(this).results;
        }
    });

    function onChange() {
        var me = internals.get(this);
        var name = me.input.value;
        var from = new Date(Number(me.from.value));
        var to = new Date(Number(me.to.value));

        var isRoot = visit => visit.isRoot;
        var descendants = visit => visit.descendants.size;
        var descending = (a, b) => b - a;

        var interestingVisits = [...me.db.visits.values()]
            .filter(v => v.history.name.contains(name))
            .filter(v => v.created > from)
            .filter(v => v.created < to)
            .map(v => v.root)
            .distinct
            .orderBy(descendants, descending);

        me.results = new Set(interestingVisits);

        this.dispatchEvent(new Event("change"));
    }

    return Query;
});