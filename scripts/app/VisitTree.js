define(["../d3/d3"], function (d3) {
    "use strict";
    var width = 10000;
    var height = 10000;
    
    class VisitTree {
        constructor(container) {
            this._svg = d3
                .select(container)
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            var svg = this._svg[0][0];
        }
    }

    Object.defineProperty(VisitTree.prototype, "visit", {
        set: function (visit) {
            var node = convert(visit);

            build.call(this, node);
        }
    });

    function convert(visit) {
        return {
            data: visit,
            name: visit.history.name,
            title: visit.id,
            children: visit.uniqueChildren.size ? [...visit.uniqueChildren].map(convert) : null
        };
    }

    function build(root) {
        this._svg.selectAll("g").remove();
        this._svg.selectAll("path").remove();

        var tree = d3.layout.tree();
        var nodes = tree.nodes(root);

        var node = this._svg
            .selectAll("g")
            .data(nodes);

        var g = node
            .enter()
            .append("g");

        node.each(function (d) {
            d.g = this;
        });

        var textboxPadding = 1;
        var nodeDistance = 30;
        var verticalMultiplier = 400; // TODO: make dynamic

        var text = g
            .append("text")
            .attr("x", textboxPadding)
            .text(function (d) { return d.name; });

        node.each(function (d) {
            if (d.parent) {
                var parentWidth = d.parent.g.getBBox().width;

                // widest of parent's siblings
                if (d.parent.parent) {
                    parentWidth = d.parent.parent.children.map(c => c.g.getBBox().width).reduce((a, b) => Math.max(a, b));
                }
                // widest of parent's cousins
                parentWidth = nodes.filter(n => n.depth === d.parent.depth).map(c => c.g.getBBox().width).reduce((a, b) => Math.max(a, b));


                d.y = nodeDistance + 2 * textboxPadding + d.parent.y + parentWidth;
            }
        });


        g
            .attr("transform", function (d) {
                return "translate(" + [d.y, d.x * verticalMultiplier] + ")";
            })
            .insert("rect", "text")
            .attr("y", function (d) {
                return -(d.g.getBBox().height + textboxPadding * 2) / 2;
            })
            .attr("height", function (d) {
                return d.g.getBBox().height + textboxPadding * 2;
            })
            .attr("width", function (d) {
                return d.g.getBBox().width + textboxPadding * 2;
            });

        var diagonal = d3.svg
            .diagonal()
            .source(function (d) {
                var source = d.source;
                var sourceWidth = source.g.getBBox().width;

                return {
                    x: source.x,
                    // start from right edge of previous box
                    y: source.y + sourceWidth
                };
            })
            .projection(function (d) {
                return [d.y, d.x * verticalMultiplier];
            });

        var links = tree.links(nodes);
        var path = this._svg
            .selectAll("path")
            .data(links);

        path
            .enter()
            .insert("path", "g")
            .attr("d", diagonal);
    }
    function build1(root) {
        this._svg.selectAll("g").remove();
        this._svg.selectAll("path").remove();

        var tree = d3
            .layout
            .tree();


        // Compute the new tree layout.
        var nodes = tree.nodes(root);

        var links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.y = d.depth * 150;
        });


        // Declare the nodes…
        var node = this._svg
            .selectAll("g")
            .data(nodes);

        // Enter the nodes.
        var nodeEnter = node
            .enter()
            .append("g")
            .attr("transform", function (d) {
                return "translate(" + [d.y, d.x] + ")";
            });

        nodeEnter.on("click", (e) => {
            this.dispatchEvent(new CustomEvent("visitChanged", { detail: e.data }));
        });

        nodeEnter
            .append("title")
            .text(function (d) {
                return d.title;
            });

        nodeEnter
            .append("circle")
            .attr("r", 5);

        nodeEnter
            .append("text")
            .text(function (d) {
                return d.name;
            });

        // Declare the links…
        var link = this._svg
            .selectAll("path")
            .data(links);

        var diagonal = d3
            .svg
            .diagonal()
            .projection(function (d) {
                return [d.y, d.x];
            });

        // Enter the links.
        link
            .enter()
            .insert("path", "g")
            .attr("d", diagonal);

    }

    return VisitTree;
});