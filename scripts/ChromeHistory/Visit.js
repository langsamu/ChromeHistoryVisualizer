define(["util", "ChromeHistory/DBObject", "libs/linq"], function (util, DBObject) {
    var internals = new WeakMap();

    util.extend(Visit, DBObject);

    function Visit(db, original) {
        DBObject.call(this, db);

        internals.set(this, {
            id: original.visitId,
            historyId: original.id,
            referringId: original.referringVisitId === "0" ? undefined : original.referringVisitId,
            transition: original.transition,
            visitTime: new Date(original.visitTime)
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

    Object.defineProperty(Visit.prototype, "referringId", {
        get: function () {
            return internals.get(this).referringId;
        }
    });

    Object.defineProperty(Visit.prototype, "transition", {
        get: function () {
            return internals.get(this).transition;
        }
    });

    Object.defineProperty(Visit.prototype, "visitTime", {
        get: function () {
            return internals.get(this).visitTime;
        }
    });

    Object.defineProperty(Visit.prototype, "history", {
        get: function () {
            var me = internals.get(this);

            if (!me.history) {
                me.history = this.db.history.filter(historyFilter, this)[0];
            }

            return me.history;

            function historyFilter(item) {
                return item.id === this.historyId;
            }
        }
    });

    // TODO: doeasn't consider uniqueness
    Object.defineProperty(Visit.prototype, "referringVisit", {
        get: function () {
            var me = internals.get(this);

            if (!me.referringVisit) {
                me.referringVisit = this.db.visits
                    .filter(function (item) {
                        return item.id === this.referringId;
                    }, this)
                    [0];
            }

            return me.referringVisit;
        }
    });

    Object.defineProperty(Visit.prototype, "referredVisits", {
        get: function () {
            var me = internals.get(this);

            if (!me.referredVisits) {

                me.referredVisits = this.db.visits
                    .filter(function (item) {
                        return item.referringId === this.id;
                    }, this);
            }

            return me.referredVisits;
        }
    });

    Object.defineProperty(Visit.prototype, "descendants", {
        get: function () {
            var me = internals.get(this);

            if (!me.descendants) {
                var result = [];

                this.uniqueReferredVisits.forEach(function (item) {
                    result.push(item);
                    result = result.concat(item.descendants);
                });

                me.descendants = result;
            }

            return me.descendants;
        }
    });

    Object.defineProperty(Visit.prototype, "uniqueReferredVisits", {
        get: function () {
            var that = this;

            return Enumerable
                .From(this.db.visits)
                .Where(sameReferrerAndHistory)
                .SelectMany(referredVisits)
                .GroupBy(historyId)
                .Select(first)
                .ToArray()

            function sameReferrerAndHistory(item) {
                return item.referringId === that.referringId && item.historyId === that.historyId; 
            }
            function referredVisits(item) {
                return item.referredVisits;
            }
            function historyId(item) {
                return item.historyId;
            }
            function first(item) {
                return item.source[0];
            }
        }
    });

    // Like above but also groups by time proximity
    Object.defineProperty(Visit.prototype, "x", {
        get: function () {
            var me = internals.get(this);

            if (!me.x) {
                var that = this;

                me.x = Enumerable
                    .From(this.db.visits)
                    .Where(function (item) {
                        //return item.referringVisitId === that.referringVisitId && item.id === that.id; // share referring visit and history item

                        return item.referringId === that.referringId && (item.historyId === that.historyId || urlNoHash(item.history.url) === urlNoHash(that.history.url));
                    })
                    .SelectMany(function (item) {
                        return item.referredVisits;
                    })
                    .GroupBy(function (item) {
                        return item.historyId;
                    })
                    .Select(first)
                    .GroupBy(function (item) {
                        return Math.floor(item.visitTime / 2000);
                    })
                    .Select(first)
                    .GroupBy(function (item) {
                        return urlNoHash(item.history.url);
                    })
                    .Select(first)
                    .ToArray();
            }

            return me.x;

            function first(item) {
                return item.source[0];
            }
            function urlNoHash(url) {
                return url.origin + url.pathname + url.search
            }
        }
    });

    Object.defineProperty(Visit.prototype, "root", {
        get: function () {
            if (!this.referringVisit) {
                return this;
            } else {
                return this.referringVisit.root;
            }
        }
    });

    // TODO: doeasn't consider uniqueness
    Object.defineProperty(Visit.prototype, "path", {
        get: function () {
            var me = internals.get(this);

            if (!me.path) {
                if (this.referringVisit) {
                    me.path = [this.referringVisit].concat(this.referringVisit.path);
                } else {
                    me.path = [];
                }
            }

            return me.path;
        }
    });

    // TODO: doeasn't consider uniqueness
    Object.defineProperty(Visit.prototype, "depth", {
        get: function () {
            var me = internals.get(this);

            if (isNaN(me.depth)) {
                me.depth = this.path.length;
            }

            return me.depth;
        }
    });

    return Visit;
});
