var SLVisit = (function () {
    function SLVisit() { }

    SLVisit.prototype.created = function () {
        this.super();
    };

    SLVisit.prototype.onClick = function () {
        console.log("SLVisit.prototype.onClick");
        var that = this;

        var before = that.original.uniqueReferredVisits.length;
        var startTime = this.original.visitTime.getTime() - 5000;
        var endTime = this.original.visitTime.getTime() + 5000;

        this.original.db.getHistoryAndVisits({ text: "", startTime: startTime, endTime: endTime }, undefined, function (visits) {
            console.log("SLVisit.prototype.onClick", "getHistoryAndVisits");
            console.log(before, that.original.uniqueReferredVisits.length);
        });
    };

    return SLVisit;
})();

Polymer('sl-visit', SLVisit.prototype);