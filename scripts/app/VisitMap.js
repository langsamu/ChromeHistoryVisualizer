var internals = new WeakMap;

export default class VisitMap extends Map {
    constructor() {
        super();

        internals.set(this, {});
    }

    get byParent() {
        const me = internals.get(this);

        if (!me.byParent) {
            const visits = [...this.values()];

            me.byParent = visits.groupBy(visit => visit.parentId);
        }

        return me.byParent;
    }

    get byHistory() {
        const me = internals.get(this);

        if (!me.byHistory) {
            const visits = [...this.values()];

            me.byHistory = visits.groupBy(visit => visit.historyId);
        }

        return me.byHistory;
    }

    get byHistoryAndParent() {
        const me = internals.get(this);

        if (!me.byHistoryAndParent) {
            const visits = [...this.values()];

            me.byHistoryAndParent = visits.groupBy(visit => visit.historyAndParent);
        }

        return me.byHistoryAndParent;
    }
}
