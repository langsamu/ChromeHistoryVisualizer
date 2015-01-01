define(["util", "ChromeHistory/Visit", "libs/linq"], function (util, ChromeVisit) {
    var internals = new WeakMap();

    util.extend(Visit, ChromeVisit);

    function Visit(db, original) {
        ChromeVisit.call(this, db, original);

        internals.set(this, {
            uniqueNoRedirectReferredVisits: undefined,
            descendants: undefined
        });
    }

    Object.defineProperty(Visit.prototype, "uniqueNoRedirectReferredVisits", {
        get: function () {
            var me = internals.get(this);

            if (!me.uniqueNoRedirectReferredVisits) {
                me.uniqueNoRedirectReferredVisits = Enumerable
                    .From(this.uniqueReferredVisits)
                    .GroupBy(function (item) {
                        return Math.floor(item.visitTime / 2000);
                    })
                    .Select(function (item) {
                        return item.source[0];
                    })
                    .ToArray();
            }

            return me.uniqueNoRedirectReferredVisits;
        }
    });

    Object.defineProperty(Visit.prototype, "descendants", {
        get: function () {
            var me = internals.get(this);

            if (!me.descendants) {
                var result = [];

                this.uniqueNoRedirectReferredVisits.forEach(function (item) {
                    result.push(item);
                    result = result.concat(item.descendants);
                });

                me.descendants = result;
            }

            return me.descendants;
        }
    });

    return Visit;
});
