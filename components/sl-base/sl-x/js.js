require(["ChromeHistory/DB", "ChromeHistory/HistoryQuery", "libs/linq"], function (DB, HistoryQuery) {
    PolymerExpressions.prototype.shortenDate = function (value) {
        return value.toLocaleString().toString();
    };
    PolymerExpressions.prototype.shortenTime = function (value) {
        return value.toLocaleTimeString();
    };

    var SLX = (function () {
        function SLX() { }

        SLX.prototype.created = function () {
            this.super();

            var that = this;

            this.db = new DB();

            this.show = function () {
                console.log(that.db.history.length, that.db.visits.length);

                this.async(that.show, null, 1000);
            };
            //this.show();

        };

        SLX.prototype.onHistoryDeleted = function (e, detail, sender) {
            this.onClick();
        };

        SLX.prototype.onClick = function () {
            var that = this;

            var text = "";
            var endTime = new Date().getTime();
            var startTime = endTime
                - 1000 // ms
                * 60 //   s
                * 60 //   m
                * 24 //   h
                * 1 //    d;
            var maxResults = 10000000;

            var query = new HistoryQuery(text, startTime, endTime, maxResults);

            this.db.getHistoryAndVisits(
                query,
                function (history) {
                    console.log("history", history.length);
                },
                function (visits) {
                    console.log("visits", visits.length);

                    var depthThreshold = 0;

                    var results = Enumerable
                        .From(visits)
                        .GroupBy(function (visit) {
                            return visit.referringId + " " + visit.historyId;
                        })
                        .Select(function (item) {
                            return item.source[0];
                        })
                        .OrderByDescending(function (visit) {
                            return visit.visitTime;
                        })
                        .ToArray();

                    console.log(visits.length,results.length);
                    console.log(results);

                    that.visits = results;
                    //get distinct
                });

            //this.db.getHistory(this.query, historyReady);

            function historyReady(results) {
                that.history = results;
            }
        };

        return SLX;
    })();

    Polymer('sl-x', SLX.prototype);
});
