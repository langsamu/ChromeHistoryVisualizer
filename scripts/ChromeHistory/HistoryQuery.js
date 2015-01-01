define(function () {
    function HistorySearchQuery(text, startTime, endTime, maxResults) {
        this.text = text;
        this.startTime = startTime;
        this.endTime = endTime;
        this.maxResults = maxResults;
    }

    return HistorySearchQuery;
});
