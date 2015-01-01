var SLBase = (function () {
    function SLBase() { }

    SLBase.prototype.created = function () {
        this.super();

    };

    return SLBase;
})();

Polymer('sl-base', SLBase.prototype);