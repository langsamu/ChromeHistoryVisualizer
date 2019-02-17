var internals = new WeakMap;

export default class Visit {
    constructor(db, original) {
        internals.set(this, {
            db: db,
            id: original.visitId,
            historyId: original.id,
            parentId: original.referringVisitId === "0" ? null : original.referringVisitId,
            created: new Date(original.visitTime)
        });
    }

    get id() {
        return internals.get(this).id;
    }

    get historyId() {
        return internals.get(this).historyId;
    }

    get parentId() {
        return internals.get(this).parentId;
    }

    get created() {
        return internals.get(this).created;
    }

    get isRoot() {
        return this.parentId === null;
    }

    get parent() {
        const me = internals.get(this);

        if (!me.parent) {
            me.parent = this.isRoot ? null : me.db.visits.get(this.parentId);
        }

        return me.parent;
    }

    get root() {
        const me = internals.get(this);

        if (!me.root) {
            me.root = this.isRoot ? this : this.parent.root;
        }

        return me.root;
    }

    get history() {
        const me = internals.get(this);

        if (!me.history) {
            me.history = me.db.history.get(this.historyId);
        }

        return me.history;
    }

    get children() {
        const me = internals.get(this);

        if (!me.children) {
            me.children = me.db.visits.byParent.get(this.id) || new Set;
        }

        return me.children;
    }

    get historyAndParent() {
        const me = internals.get(this);

        if (!me.historyAndParent) {
            // Root visits should not be clustered, so use their own id
            const parentId = this.isRoot ? "this." + this.id : "parent." + this.parentId;

            // Clustering key is a compound of parent and history
            me.historyAndParent = String([parentId, this.historyId]);
        }

        return me.historyAndParent;
    }

    get uniqueChildren() {
        const me = internals.get(this);

        if (!me.uniqueChildren) {
            me.uniqueChildren = new Set(me
                .db.visits
                .byHistoryAndParent.get(this.historyAndParent).toArray()
                .selectMany(visit => visit.children.toArray())
                .groupBy(visit => visit.historyId).toArray()
                .map(children => children.toArray().last));

            //var mySibling = me.db.visits.byHistoryAndParent.get(this.historyAndParent).toArray();
            //var ourChildren = mySibling.selectMany(visit => visit.children.toArray());
            //var byHistory = ourChildren.groupBy(visit => visit.historyId).toArray();
            //var lastOfEach = byHistory.map(children => children.toArray().last);

            //me.uniqueChildren = new Set(lastOfEach);
        }

        return me.uniqueChildren;
    }

    get descendants() {
        const me = internals.get(this);

        if (!me.descendants) {
            const breadthFirst = (previous, current) => previous.concat([current].concat([...current.descendants]));

            me.descendants = new Set([...this.uniqueChildren].reduce(breadthFirst, []));
        }

        return me.descendants;
    }
}
