define(["ChromeHistory/DB"], function (DB) {
    "use strict";

    var db = new DB;

    //a();
    //b();
    a1();

    function a1() {
        var lists = document.getElementsByTagName("ul");
        for (var i = 0; i < lists.length; i++) {
            lists[i].addEventListener("click", function (e) {
                if (this !== e.srcElement) {
                    a4(e.srcElement.visit);
                }
            });
        }

        db.getAllHistory(function (history) {
            db.populateHistoryVisits(history, function (history2) {
                db.visits
                    .filter(function (item) { return item.depth > 10 }).map(function (item) { return item.root })
                    //.filter(function (item) { return item.isRoot && item.children.length })
                    //.filter(function (item) { return item.children.length || item.uniqueChildren.length })
                    .forEach(function (item) {
                        a2(item);
                    });
            });
        });
    }

    function a2(visit) {
        var all = document.getElementById("all");
        //clear(referring1);
        a3(all, visit);
    }

    function a4(visit) {
        var referring = document.getElementById("referring");
        clear(referring);
        if (visit.parent) {
            a3(referring, visit.parent);
        }

        var current = document.getElementById("current");
        clear(current);
        a3(current, visit);

        var referred = document.getElementById("referred");
        clear(referred);
        visit.uniqueChildren.forEach(function (item) {
            a3(referred, item);
        });

        var descendants = document.getElementById("descendants");
        clear(descendants);
        visit.descendants.forEach(function (item) {
            a3(descendants, item);
        });
    }

    function a3(ul, visit) {
        var li = document.createElement("li");
        li.visit = visit;
        li.textContent = visit.id + " " + (visit.history.title ? visit.history.title : visit.history.url.toString());

        ul.appendChild(li);
    }

    function clear(ul) {
        while (ul.firstChild) {
            ul.removeChild(ul.firstChild);
        }
    }

    function aaa(visit) {
        while (others1.firstChild) {
            others1.removeChild(others1.firstChild);
        }
        while (others2.firstChild) {
            others2.removeChild(others2.firstChild);
        }

        visit.referredVisits.forEach(function (item) {
            var li = document.createElement("li");

            li.addEventListener("click", function () { aaa(item); })
            li.textContent = item.id + " " + (item.history.title ? item.history.title : item.history.url.toString());

            others1.appendChild(li);
        });
        visit.uniqueReferredVisits.forEach(function (item) {
            var li = document.createElement("li");

            li.addEventListener("click", function () { aaa(item); })
            li.textContent = item.id + " " + (item.history.title ? item.history.title : item.history.url.toString());

            others2.appendChild(li);
        });
    }

    function b() {
        document.getElementsByTagName("html")[0].style.height = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";

        var list = document.createElement("ul");
        list.id = "list";
        list.style.height = "100%";
        list.style.overflow = "scroll";
        list.style.cssFloat = "left";
        list.style.width = "200px";
        list.style.margin = "0";
        document.body.appendChild(list);

        var others1 = document.createElement("ul");
        others1.id = "others1";
        others1.style.height = "100%";
        others1.style.overflow = "scroll";
        others1.style.cssFloat = "left";
        others1.style.width = "200px";
        others1.style.margin = "0";
        document.body.appendChild(others1);

        var others2 = document.createElement("ul");
        others2.id = "others2";
        others2.style.height = "100%";
        others2.style.overflow = "scroll";
        others2.style.cssFloat = "left";
        others2.style.width = "200px";
        others2.style.margin = "0";
        document.body.appendChild(others2);


        db.getAllHistory(function (history) {
            db.populateHistoryVisits(history, function (history2) {
                db.visits
                    .filter(function (item) { return item.referredVisits.length || item.uniqueReferredVisits.length })
                    .forEach(function (item) {
                        var li = document.createElement("li");
                        li.addEventListener("click", function () { aaa(item); })

                        li.textContent = item.id + " " + (item.history.title ? item.history.title : item.history.url.toString());

                        list.appendChild(li);
                    });
            });
        });
    }

    function a() {
        db.getAllHistory(function (history) {
            db.populateHistoryVisits(history, function () {
                console.log(0, history);

                var wikipediaHistory = db.search("https?\:\/\/..\.wikipedia\.org\/wiki\/.+");

                console.log(1, wikipediaHistory);

                var wikipediaVisits = wikipediaHistory
                    .map(function (item) {
                        return item.visits
                    })
                    .reduce(function (previous, current) {
                        return previous.concat(current);
                    });

                console.log(2, wikipediaVisits);

                var roots = wikipediaVisits.filter(function (item) { return !item.referringId });

                console.log(3, roots);

                var interestingVisits = roots.filter(function (item) { return item.descendants.length > 0 });

                console.log(4, interestingVisits);
            });
        });
        //db.search("https?\:\/\/..\.wikipedia\.org\/wiki\/.+", callback);
        //db.search("https?\:\/\/(www\.)?youtube.com/watch[\?]v=.+", callback);
        //db.search("google\.com\/.+", callback);

        function callback(result) {
            console.log(db);
            //console.log(result.map(function (item) { return item.title}));
        }

    }
});