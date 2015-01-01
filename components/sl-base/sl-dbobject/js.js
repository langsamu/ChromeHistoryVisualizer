var SLDBObject = (function () {
    function SLDBObject() { }

    SLDBObject.prototype.created = function () {
        this.super();

        this.original = {};
    };

    return SLDBObject;
})();

Polymer('sl-dbobject', SLDBObject.prototype);