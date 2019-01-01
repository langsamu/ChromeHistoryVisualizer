define(function () {
    "use strict";

    return class HistoryQuery {
        constructor(text, startTime, endTime, maxResults) {
            this.text = text || "";
            this.startTime = startTime || (new Date(0)).getTime();
            this.endTime = endTime || (new Date()).getTime();
            this.maxResults = maxResults || 99999999;
        }
    }
});