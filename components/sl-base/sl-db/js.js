var SLDB = (function () {
    function SLDB() { }

    SLDB.prototype.created = function () {
        this.super();

        this.db = {};
    };

    return SLDB;
})();

Polymer('sl-db', SLDB.prototype);