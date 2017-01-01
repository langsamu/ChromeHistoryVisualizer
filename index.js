(function () {
    "use strict";
    
    Object.defineProperty(Object.prototype, "values", {
        get: function () {
            return Object.keys(this).map(key => this[key]);
        }
    });
    Array.prototype.selectMany = function (selector) {
        return this.map(selector).reduce((x, y) => x.concat(y), []);
    };
    Array.prototype.groupBy = function (keySelector) {
        var groups = {};
        this.forEach(function (el) {
            var key = keySelector(el);
            if (key in groups == false) {
                groups[key] = [];
            }
            groups[key].push(el);
        });
        return Object.keys(groups).map(function (key) {
            return {
                key: key,
                values: groups[key]
            };
        });
    };
    Array.prototype.first = function () {
        return this[0];
    };
    Array.prototype.last = function () {
        return this[this.length - 1];
    };
    Array.prototype.orderBy = function (selector, comparer) {
        comparer = comparer || ((a, b) => a - b);

        var mapped = this.map((e, i) => ({ index: i, value: selector(e) }));
        mapped.sort((a, b) => comparer(a.value, b.value));
        return mapped.map(e => this[e.index]);
    }
    function noOp() { };

    document.addEventListener("DOMContentLoaded", onLoad);

    function onLoad() {
        var callback = function () { console.log(this) };
        var a = new DB(callback);


        //window.setTimeout(function () {
        //    window.db = { history: [], visits: [] };

        //    db.history.push(...history.map(item => new History(db, item)));
        //    db.visits.push(...visits.map(item => new Visit(db, item)));

        //    console.log(db);



        //    var interestingVisits = db.visits.orderBy(e => e.descendants.length);
        //    var visit = interestingVisits.last();

        //    showTree([build(visit)]);

        //    function build(visit) {
        //        return {
        //            name: visit.history.articleName,
        //            title: visit.id,
        //            children: visit.uniqueChildren.map(build)
        //        };
        //    }
        //}, 1000)
    }

    var DB = (function () {
        class DB {
            constructor(callback) {
                var query = {
                    text: "",
                    startTime: (new Date(0)).getTime(),
                    endTime: (new Date()).getTime(),
                    maxResults: 100000
                };

                var saveHistoryAndVisits = items => {
                    this.history = items.map(item => new History(this, item));
                    this.visits = [];

                    var lastHistory = this.history.length - 1;
                    var saveVisits = (i, items) => {
                        this.visits.push(...items.map(item => new Visit(this, item)));

                        if (i === lastHistory) {
                            callback.apply(this);
                        };
                    };
                    var getAndSaveVisits = (item, i) => chrome.history.getVisits(item, saveVisits.bind(undefined, i));
                    var convertToQuery = item => ({ url: item.url });

                    this.history.map(convertToQuery).forEach(getAndSaveVisits);
                };

                chrome.history.search(query, saveHistoryAndVisits);
            }
        }

        return DB;
    }());
    var History = (function () {
        class History {
            constructor(db, original) {
                this.db = db;
                this.id = Number(original.id);
                this.url = original.url;
                this.title = original.title;
            }
        }

        Object.defineProperty(History.prototype, "visits", {
            get: function () {
                return this.db.visits.filter(visit => visit.historyId === this.id);
            }
        });

        Object.defineProperty(History.prototype, "articleName", {
            get: function () {
                return this.title;
                return decodeURI(this.url.split("/")[4]).replace(/_/g, " ")
            }
        });

        return History;
    }());
    var Visit = (function () {
        class Visit {
            constructor(db, original) {
                this.db = db;
                this.id = Number(original.visitId);
                this.historyId = Number(original.id);
                this.parentId = original.referringVisitId === "0" ? null : Number(original.referringVisitId);
            }
        }

        Object.defineProperty(Visit.prototype, "isRoot", {
            get: function () {
                return this.parentId === null
            }
        });

        Object.defineProperty(Visit.prototype, "history", {
            get: function () {
                return this.db.history.filter(history => history.id === this.historyId)[0];
            }
        });

        Object.defineProperty(Visit.prototype, "parent", {
            get: function () {
                return this.db.visits.filter(visit => this.isRoot ? null : visit.id === this.parentId)[0];
            }
        });

        Object.defineProperty(Visit.prototype, "children", {
            get: function () {
                if (!this._children) {
                    this._children = this.db.visits.filter(visit => visit.parentId === this.id);
                }

                return this._children;
            }
        });

        Object.defineProperty(Visit.prototype, "uniqueChildren", {
            get: function () {
                return this.db.visits
                    .filter(visit => visit.historyId === this.historyId && visit.parentId === this.parentId)
                    .selectMany(visit => visit.children)
                    .groupBy(visit => visit.historyId)
                    .map(group => group.values.first());
            }
        });

        Object.defineProperty(Visit.prototype, "descendants", {
            get: function () {
                return this.uniqueChildren.reduce(depthFirst, []);;

                function depthFirst(previous, current) {
                    return previous.concat([current].concat(current.descendants));
                }
            }
        });

        return Visit;
    }());

    function showTree(visits) {
        var data = {
            name: "root",
            children: visits
        };

        var width = window.innerWidth;
        var height = window.innerHeight;

        var cluster = d3
            .layout
            .cluster()
            .size([height, width - 160]);

        var diagonal = d3
            .svg
            .diagonal()
            .projection(function (d) {
                return [d.y, d.x];
            });

        var svg = d3
            .select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(40,0)");

        var nodes = cluster.nodes(data);
        var links = cluster.links(nodes);

        var link = svg
            .selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal);

        var node = svg
            .selectAll(".node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        node
            .append("circle")
            .attr("r", 4.5)
            .append("title").text(function (d) {
                return d.title;
            });

        node
            .append("text")
            .attr("dx", function (d) {
                return d.children ? -8 : 8;
            })
            .attr("dy", 3)
            .style("text-anchor", function (d) {
                return d.children ? "end" : "start";
            })
            .text(function (d) {
                return d.name;
            });
    }
}());