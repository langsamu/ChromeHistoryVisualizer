var SLHistory = (function () {
    function SLHistory() { }

    SLHistory.prototype.created = function () {
        this.super();

        this.showVisits = false;
    };

    SLHistory.prototype.onVisitsClick = function () {
        var that = this;
        var history = that.original;
        var url = history.url.toString();

        history.db.getVisits(url, gotVisits);

        function gotVisits(visits) {
            //that.showVisits = !that.showVisits;

            var thisVisit = visits.filter(sameTime);

            console.log(thisVisit);

            function sameTime(visit) {
                return visit.visitTime.valueOf() === history.lastVisitTime.valueOf();
            }
        }
    };

    SLHistory.prototype.onDeleteClick = function () {
        var that = this;

        this.original.delete(onDeleted);

        function onDeleted() {
            that.fire("deleted", undefined, that);
        }
    };

    return SLHistory;
})();

Polymer('sl-history', SLHistory.prototype);