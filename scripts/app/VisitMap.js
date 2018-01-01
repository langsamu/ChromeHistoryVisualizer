define(["utils"], function () {
    "use strict";
    
    var internals = new WeakMap;

    class VisitMap extends Map {
        constructor() {
            super();

            internals.set(this, {});
        }
    }

    Object.defineProperty(VisitMap.prototype, "byParent", {
        get: function () {
            var me = internals.get(this);

            if (!me.byParent) {
                var visits = [...this.values()];

                me.byParent = visits.groupBy(visit => visit.parentId);
            }

            return me.byParent;
        }
    });

    Object.defineProperty(VisitMap.prototype, "byHistory", {
        get: function () {
            var me = internals.get(this);

            if (!me.byHistory) {
                var visits = [...this.values()];

                me.byHistory = visits.groupBy(visit => visit.historyId);
            }

            return me.byHistory;
        }
    });

    Object.defineProperty(VisitMap.prototype, "byHistoryAndParent", {
        get: function () {
            var me = internals.get(this);

            if (!me.byHistoryAndParent) {
                var visits = [...this.values()];

                me.byHistoryAndParent = visits.groupBy(visit => visit.historyAndParent);
            }

            return me.byHistoryAndParent;
        }
    });

    return VisitMap;
});