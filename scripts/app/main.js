define(["DB", "VisitTree", "VisitSelect", "Query", "utils"], (DB, VisitTree, VisitSelect, Query) => {
    "use strict";

    var db;
    
    var visitTree = new VisitTree(document.getElementById("tree"));
    var visitList = new VisitSelect(document.getElementById("list"));
    
    var observer = (changes) => {
        var process = (change) => {
            if (change.name === "selectedVisit") {
                visitTree.visit = change.object.selectedVisit;
            }
        };

        changes.forEach(process);
    };

    Object.observe(visitList, observer, ["update"]);

    var onDbProgress = (p) => {
        progress.value = p;
    };

    var onDbReady = function () {
        window.db = this;
        var query = new Query(document.getElementById("query"), this);

        query.addEventListener("change", function () {
            visitList.visits = this.results;
        });

        query.text = "";
    };

    db = new DB(onDbReady, onDbProgress);
    
});