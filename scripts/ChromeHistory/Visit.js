define(["util", "ChromeHistory/DBObject", "libs/linq"], function (util, DBObject) {
    var internals = new WeakMap();

    util.extend(Visit, DBObject);

    function Visit(db, original) {
        DBObject.call(this, db);

        internals.set(this, {
            id: Number(original.visitId),
            historyId: Number(original.id),
            parentId: original.referringVisitId === "0" ? null : Number(original.referringVisitId),
            transition: original.transition,
            created: new Date(original.visitTime)
        });
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

    Object.defineProperty(Visit.prototype, "transition", {
        get: function () {
            return internals.get(this).transition;
        }
    });

    Object.defineProperty(Visit.prototype, "created", {
        get: function () {
            return internals.get(this).created;
        }
    });

    Object.defineProperty(Visit.prototype, "history", {
        get: function () {
            var me = internals.get(this);

            if (!me.history) {
                me.history = this.db
                    .history
                    .filter(historyId, this)
                    [0];

                function historyId(item) {
                    return item.id === this.historyId;
                }
            }

            return me.history;
        }
    });

    Object.defineProperty(Visit.prototype, "parent", {
        get: function () {
            var me = internals.get(this);

            if (me.parent === undefined) {
                if (this.isRoot) {
                    me.parent = null;
                } else {
                    me.parent = this.db
                        .visits
                        .filter(parentId, this)
                        [0];

                    function parentId(item) {
                        return item.id === this.parentId;
                    }
                }
            }

            return me.parent;
        }
    });

    Object.defineProperty(Visit.prototype, "children", {
        get: function () {
            var me = internals.get(this);

            if (!me.children) {
                me.children = this.db
                    .visits
                    .filter(parent, this);

                function parent(item) {
                    return item.parentId === this.id;
                }
            }

            return me.children;
        }
    });

    Object.defineProperty(Visit.prototype, "uniqueChildren", {
        get: function () {
            var me = internals.get(this);

            if (!me.uniqueChildren) {
                var that = this;

                me.uniqueChildren = Enumerable
                    .From(this.db.visits)
                    .Where(sameParentAndHistory)
                    .SelectMany(next)
                    .GroupBy(historyId)
                    .Select(first)
                    .ToArray();

                function sameParentAndHistory(item) {
                    return item.parentId === that.parentId && item.historyId === that.historyId;
                }
                function next(item) {
                    return item.children;
                }
                function historyId(item) {
                    return item.historyId;
                }
                function first(item) {
                    return item.source[0];
                }
            }

            return me.uniqueChildren;
        }
    });

    Object.defineProperty(Visit.prototype, "descendants", {
        get: function () {
            var me = internals.get(this);

            if (!me.descendants) {
                me.descendants = this.uniqueChildren.reduce(depthFirst, []);;

                function depthFirst(previous, current) {
                    return previous.concat([current].concat(current.descendants));
                }
            }

            return me.descendants;
        }
    });

    Object.defineProperty(Visit.prototype, "isRoot", {
        get: function () {
            var me = internals.get(this);

            if (me.isRoot === undefined) {
                me.isRoot = this.parentId === null;
            }

            return me.isRoot;
        }
    });

    Object.defineProperty(Visit.prototype, "root", {
        get: function () {
            var me = internals.get(this);

            if (me.Root === undefined) {
                if (this.isRoot) {
                    me.root = this;
                } else {
                    if (this.parent) {
                        me.root = this.parent.root;
                    } else {
                        me.root = this;
                    }
                }
            }

            return me.root;
        }
    });

    Object.defineProperty(Visit.prototype, "path", {
        get: function () {
            var me = internals.get(this);

            if (me.path === undefined) {
                if (this.isRoot) {
                    me.path = [];
                } else {
                    if (this.parent) {
                        me.path = [this.parent].concat(this.parent.path);
                    } else {
                        me.path = [];
                    }
                }
            }

            return me.path;
        }
    });

    Object.defineProperty(Visit.prototype, "depth", {
        get: function () {
            var me = internals.get(this);

            if (me.depth === undefined) {
                me.depth = this.path.length;
            }

            return me.depth;
        }
    });

    return Visit;
});
