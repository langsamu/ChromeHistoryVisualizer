define(["EventTarget"], function (EventTarget) {
    "use strict";

    var internals = new WeakMap;

    class VisitSelect extends EventTarget {
        constructor(container) {
            super();
            
            var select = document.createElement("select");
            select.size = 10;

            container.appendChild(select);

            select.addEventListener("change", (e) => {
                this.selectedVisit = select.options[select.selectedIndex].visit;
            });

            internals.set(this, {
                select: select
            });
        }
    }

    Object.defineProperty(VisitSelect.prototype, "visits", {
        get: function () {
            var me = internals.get(this);

            return me.visits;
        },
        set: function (value) {
            var me = internals.get(this);

            Object.getNotifier(this).notify({
                type: "update",
                name: "visits",
                oldValue: me.visits
            });

            me.visits = value;

            this.dispatchEvent(new Event("visitsChange"));

            build.call(this);
        }
    });

    Object.defineProperty(VisitSelect.prototype, "selectedVisit", {
        get: function () {
            var me = internals.get(this);

            return me.selectedVisit;
        },
        set: function (value) {
            var me = internals.get(this);

            Object.getNotifier(this).notify({
                type: "update",
                name: "selectedVisit",
                oldValue: me.selectedVisit
            });

            me.selectedVisit = value;

            this.dispatchEvent(new Event("visitChange"));
        }
    });

    function build() {
        var me = internals.get(this);

        Array.from(me.select.options).forEach(o => o.remove());

        me.visits.forEach((visit) => {
            var option = document.createElement("option");
            option.text = visit.history.name;
            option.visit = visit;

            me.select.add(option);
        });
    }

    return VisitSelect;
});