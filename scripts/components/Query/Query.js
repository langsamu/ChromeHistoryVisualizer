(function (currentScript) {
    require(["utils"], function () {
        "use strict";

        var internals = new WeakMap;

        class Query extends HTMLElement {
            createdCallback() {
                var me = internals.set(this, {}).get(this);

                var shadow = this.createShadowRoot();

                var template = currentScript.ownerDocument.querySelector("template");
                var clone = document.importNode(template.content, true)

                shadow.appendChild(clone);

                me.input = shadow.getElementById("input");
                me.input.addEventListener("input", onChange.bind(this));

                me.from = shadow.getElementById("from");
                me.from.addEventListener("input", onChange.bind(this));

                me.to = shadow.getElementById("to");
                me.to.addEventListener("input", onChange.bind(this));
            }
        }

        Object.defineProperty(Query.prototype, "db", {
            get: function () {
                var me = internals.get(this);

                return me.db;
            },
            set: function (value) {
                var me = internals.get(this);

                me.db = value;

                var v = [...this.db.visits.values()].map(v => v.created.getTime()).distinct.sort();
                var first = v[1];
                var last = v.last;

                me.from.min = first;
                me.from.max = last;
                me.from.value = first;

                me.to.min = first;
                me.to.max = last;
                me.to.value = last;

                onChange.call(this);
            }
        });
        Object.defineProperty(Query.prototype, "text", {
            get: function () {
                var me = internals.get(this);

                return me.input.value;
            },
            set: function (value) {
                var me = internals.get(this);

                me.input.value = value;

                onChange.call(this);
            }
        });
        Object.defineProperty(Query.prototype, "results", {
            get: function () {
                var me = internals.get(this);

                return me.results;
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

        document.registerElement("ChromeHistory-Query", Query);
    });
})(document.currentScript);