define(["utils"], function () {
    "use strict";

    var internals = new WeakMap;

    class Visit {
        constructor(db, original) {
            internals.set(this, {
                db: db,
                id: original.visitId,
                historyId: original.id,
                parentId: original.referringVisitId === "0" ? null : original.referringVisitId,
                created: new Date(original.visitTime)
            });
        }
    }

    Object.defineProperty(Visit.prototype, "id", {
        get: function () {
            return internals.get(this).id;
        }
    });

    Object.defineProperty(Visit.prototype, "historyId", {
        get: function () {
            return internals.get(this).historyId;
        }
    });

    Object.defineProperty(Visit.prototype, "parentId", {
        get: function () {
            return internals.get(this).parentId;
        }
    });

    Object.defineProperty(Visit.prototype, "created", {
        get: function () {
            return internals.get(this).created;
        }
    });

    Object.defineProperty(Visit.prototype, "isRoot", {
        get: function () {
            return this.parentId === null
        }
    });

    Object.defineProperty(Visit.prototype, "parent", {
        get: function () {
            var me = internals.get(this);

            if (!me.parent) {
                me.parent = this.isRoot ? null : me.db.visits.get(this.parentId);
            }

            return me.parent;
        }
    });

    Object.defineProperty(Visit.prototype, "root", {
        get: function () {
            var me = internals.get(this);

            if (!me.root) {
                me.root = this.isRoot ? this : this.parent.root;
            }

            return me.root;
        }
    });

    Object.defineProperty(Visit.prototype, "history", {
        get: function () {
            var me = internals.get(this);

            if (!me.history) {
                me.history = me.db.history.get(this.historyId);
            }
            return me.history;
        }
    });

    Object.defineProperty(Visit.prototype, "children", {
        get: function () {
            var me = internals.get(this);

            if (!me.children) {
                me.children = me.db.visits.byParent.get(this.id) || new Set;
            }

            return me.children;
        }
    });

    Object.defineProperty(Visit.prototype, "historyAndParent", {
        get: function () {
            var me = internals.get(this);

            if (!me.historyAndParent) {
                // Root visits should not be clustered, so use their own id
                var parentId = this.isRoot ? "this." + this.id : "parent." + this.parentId;

                // Clustering key is a compound of parent and history
                me.historyAndParent = String([parentId, this.historyId]);
            }

            return me.historyAndParent;
        }
    });

    Object.defineProperty(Visit.prototype, "uniqueChildren", {
        get: function () {
            var me = internals.get(this);

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
    });

    Object.defineProperty(Visit.prototype, "descendants", {
        get: function () {
            var me = internals.get(this);

            if (!me.descendants) {
                var breadthFirst = (previous, current) => previous.concat([current].concat([...current.descendants]));

                me.descendants = new Set([...this.uniqueChildren].reduce(breadthFirst, []));
            }

            return me.descendants;
        }
    });

    return Visit;
});