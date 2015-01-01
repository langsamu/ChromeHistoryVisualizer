require(["ChromeHistory/HistoryQuery"], function (HistoryQuery) {
    var HistoryQueryUI = (function () {
        function HistoryQueryUI() { }

        HistoryQueryUI.prototype.ready = function () {
            this.super();

            this.maxResults = 100;

            update.call(this);
        };

        HistoryQueryUI.prototype.textChanged = update;
        HistoryQueryUI.prototype.startTimeChanged = update;
        HistoryQueryUI.prototype.endTimeChanged = update;
        HistoryQueryUI.prototype.maxResultsChanged = update;

        function update() {
            var text = this.text ? this.text : "";
            var startTime = this.startTime ? new Date(this.startTime).getTime() : undefined;
            var endTime = this.endTime ? new Date(this.endTime).getTime() : undefined;
            var maxResults = this.maxResults ? parseInt(this.maxResults) : undefined;

            this.query = new HistoryQuery(text, startTime, endTime, maxResults);
        }

        return HistoryQueryUI;
    })();

    Polymer('sl-searcher', HistoryQueryUI.prototype);
});