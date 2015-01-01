/// <reference path="chrome.intellisense.js" />
/// <reference path="linq-vsdoc.js" />
/// <reference path="util.js" />
/// <reference path="classes.js" />

Array.prototype.take = function (count) {
    return this.slice(0, count);
};
Array.prototype.clone = function () {
    return this.slice(0);
};
Array.prototype.skip = function (count) {
    return this.slice(count, this.length - count);
};

(function () {
    "use strict";

    window.app = window.app || {};

    document.addEventListener("DOMContentLoaded", onLoad);

    function onLoad(e) {
        //app.db = new ChromeHistory.DB();

        //var beginningOfTime = (new Date(0)).getTime();
        //var any = "https";

        //var searchDetails = {
        //    text: any,
        //    startTime: beginningOfTime,
        //    maxResults: 10000
        //};

        //app.db.search(searchDetails);

        app.db = new WikipediaHistory.DB();

        document.querySelector("button").addEventListener("click", onClick);
    }

    function onClick() {
        var select = document.createElement("select");
        document.body.appendChild(select);
        select.style.position = "absolute";
        select.style.left = "25px";
        var option = document.createElement("option");
        option.text = "";
        select.appendChild(option);

        select.addEventListener("change", function (e) {
            var visitId = e.srcElement.selectedOptions[0].value;
            if (visitId) {
                var visit = getVisit(visitId);

                var svg = document.body.querySelector("svg");
                if (svg) {
                    document.body.removeChild(svg);

                }
                showJourneyUnique(visit);

            }
        });

        var visits = app.db
            .uniqueVisits
            .filter(function (item) {
                return !item.referringVisit && item.descendants.length > 0
            })
            .map(function (item) {
                var option = document.createElement("option");
                option.value = item.visitId;
                option.text = item.history.article.name;

                return option;
            })
            .forEach(function (item) {
                select.appendChild(item);
            });


        //allArticles();
        //path(getHistory("56519"));

        //graphJson(getVisit("121036"));
        //deepest();
        //mostDescendants();


        //showJourney(getVisit("115794"));
        //showJourneyUnique(getVisit("115794"));
    }

    function getVisit(visitId) {
        return app.db.uniqueVisits
            .filter(function (item) {
                return item.visitId === visitId;
            })
            [0];

    }
    function getHistory(historyId) {
        return app.db.history
            .filter(function (item) {
                return item.id === historyId
            })
            [0];

    }
    function deepest() {
        var deepest = Enumerable
            .From(app.db.uniqueVisits)
            .Where(function (item) {
                return item.depth > 5;
            })
            .Select(function (item) {
                return item.path[item.depth - 1]
            })
            .OrderByDescending(function (item) {
                return item.depth;
            })
            .Distinct(function (item) {
                return item.visitId;
            })
            .Select(function (item) {
                return [item].concat(item.descendants).map(function (item) {
                    return {
                        id: item.visitId,
                        depth: item.depth,
                        name: item.history.article.name
                    };
                });
            })
            .ToArray();
        console.log("deepest", deepest);
    }
    function mostDescendants() {
        var mostDescendants = Enumerable
            .From(app.db.uniqueVisits)
            .Where(function (item) {
                return !item.referringVisit;
            })
            .OrderByDescending(function (item) {
                return item.descendants.length;
            })
            .Select(function (item) {
                return [item].concat(item.descendants).map(function (item) {
                    return {
                        id: item.visitId,
                        depth: item.depth,
                        name: item.history.article.name
                    };
                })
            }).
            ToArray();

        console.log("mostDescendants", mostDescendants);
    }
    function showJourney(visit) {
        var data = build(visit);

        showTree([data]);

        function build(visit) {
            return {
                name: visit.history.articleName + visit.history.url.hash,
                title: visit.visitId,
                children: Enumerable
                    .From(visit.referredVisits)
                    .OrderBy(function (item) {
                        return item.visitTime;
                    })
                    .Select(build)
                    .ToArray()
            };
        }
    }
    function showJourneyUnique(visit) {
        var data = build(visit);

        showTree([data]);

        function build(visit) {
            return {
                name: visit.history.articleName + visit.history.url.hash,
                title: visit.visitId,
                children: Enumerable
                    .From(visit.uniqueNoRedirectReferredVisits)
                    .OrderBy(function (item) {
                        return item.visitTime;
                    }).Select(build)
                    .ToArray()
            };
        }
    }

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
                return d.title
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

    function graphJson(visit) {
        window.result = {
            nodes: [],
            links: []
        };

        var index = 0;

        recurse(index, result, visit);

        window.result.nodes
            .filter(function (item) {
                return item.referringVisit;
            })
            .forEach(function (item) {
                window.result.links.push({
                    source: item.index,
                    target: item.referringVisit.index
                });
            });

        console.log(JSON.stringify(window.result));

        function recurse(index, result, visit) {
            visit.index = index;
            index++;

            result.nodes.push(visit);

            visit.referredVisits
                .forEach(function (referredVisit) {
                    index = recurse(index, result, referredVisit);
                });

            return index;
        }
    }

    function path(history) {
        var pathNode = node(document.body, "path");

        history.visits
            .forEach(function (item) {
                recurse(item, pathNode);
            });

        function recurse(visit, parent) {
            Enumerable
                .From(visit.referredVisits)
                .OrderBy(function (item) {
                    return item.visitTime
                })
                .ForEach(function (referred) {
                    var current = node(parent, referred.history.article.name);

                    recurse(referred, current);
                });
        }
    }

    function allArticles() {
        var topNode = node(document.body, "all");

        Enumerable
            .From(app.db.articles)
            .ForEach(function (article) {
                var articleNode = node(topNode, "article");
                node(articleNode, "name", article.name);

                Enumerable
                    .From(article.history)
                    .ForEach(function (history) {
                        var historyNode = node(articleNode, "history");
                        node(historyNode, "url", history.url);

                        Enumerable
                            .From(history.visits)
                            .ForEach(function (visit) {
                                var visitNode = node(historyNode, "visit");
                                node(visitNode, "time", new Date(visit.visitTime).toLocaleString());
                            });
                    });
            });
    }

    function node(parent, name, value) {
        var checkbox = document.createElement("input");
        parent.appendChild(checkbox);
        checkbox.setAttribute("type", "checkbox");
        //checkbox.setAttribute("checked", "false");

        var fieldset = document.createElement("fieldset");
        parent.appendChild(fieldset);

        var legend = document.createElement("legend");
        fieldset.appendChild(legend);
        legend.textContent = name;

        if (value) {
            var valueNode = document.createTextNode(value);
            fieldset.appendChild(valueNode);
        }

        return fieldset;
    }
})();