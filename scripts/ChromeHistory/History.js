define(["util", "ChromeHistory/DBObject"], function (util, DBObject) {
    var internals = new WeakMap();

    util.extend(History, DBObject);

    function History(db, original) {
        DBObject.call(this, db)

        internals.set(this, {
            id: original.id,
            lastVisitTime: new Date(original.lastVisitTime),
            title: original.title,
            typedCount: original.typedCount,
            url: new URL(original.url),
            visitCount: original.visitCount
        });
    }

    Object.defineProperty(History.prototype, "id", {
        get: function () {
            return internals.get(this).id;
        }
    });

    Object.defineProperty(History.prototype, "lastVisitTime", {
        get: function () {
            return internals.get(this).lastVisitTime;
        }
    });

    Object.defineProperty(History.prototype, "title", {
        get: function () {
            return internals.get(this).title;
        }
    });

    Object.defineProperty(History.prototype, "typedCount", {
        get: function () {
            return internals.get(this).typedCount;
        }
    });

    Object.defineProperty(History.prototype, "url", {
        get: function () {
            return internals.get(this).url;
        }
    });

    Object.defineProperty(History.prototype, "visitCount", {
        get: function () {
            return internals.get(this).visitCount;
        }
    });

    //TODO: Why "Not allowed to load local resource"?
    Object.defineProperty(History.prototype, "favicon", {
        get: function () {
            return url("chrome://favicon/size/16@1/" + this.url.href);

            function url(s) {
                // http://www.w3.org/TR/css3-values/#uris
                // Parentheses, commas, whitespace characters, single quotes (') and double
                // quotes (") appearing in a URI must be escaped with a backslash
                var s2 = s.replace(/(\(|\)|\,|\s|\'|\"|\\)/g, "\\$1");
                // WebKit has a bug when it comes to URLs that end with \
                // https://bugs.webkit.org/show_bug.cgi?id=28885
                if (/\\\\$/.test(s2)) {
                    // Add a space to work around the WebKit bug.
                    s2 += " ";
                }
                return s2;
            }
        }
    });

    //TODO: Add lastVisit?

    Object.defineProperty(History.prototype, "visits", {
        get: function () {
            return this.db.visits.filter(idFilter, this);

            function idFilter(visit) {
                return visit.historyId === this.id;
            }
        }
    });

    History.prototype.delete = function (callback) {
        this.db.deleteHistory(this, callback);
    };

    History.prototype.toString = function () {
        return this.title ? this.title : this.url.href;
    };

    return History;
});
