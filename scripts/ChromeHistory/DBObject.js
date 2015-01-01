define(function () {
    var internals = new WeakMap();

    function DBObject(db) {
        internals.set(this, {
            db: db
        });
    }

    Object.defineProperty(DBObject.prototype, "db", {
        get: function () {
            var me = internals.get(this);

            return me.db;
        }
    });

    return DBObject;
});
