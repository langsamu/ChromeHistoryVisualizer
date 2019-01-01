(function (currentScript) {
    require(["../d3/d3"], function (d3) {
        "use strict";

        var internals = new WeakMap;

        class VisitTree extends HTMLElement {
            createdCallback() {
                var me = internals.set(this, {}).get(this);

                var shadow = this.createShadowRoot();

                var template = currentScript.ownerDocument.querySelector("template");
                shadow.appendChild(document.importNode(template.content, true));

                me.svg = shadow.querySelector("svg");
                this.width = this.getAttribute("width");
                this.height = this.getAttribute("height");

                this.addEventListener("visitChanged", build.bind(this));
            }

            attributeChangedCallback() {
                this.width = this.getAttribute("width");
                this.height = this.getAttribute("height");

                build.call(this);
            }
        }

        Object.defineProperty(VisitTree.prototype, "height", {
            get: function () {
                var me = internals.get(this);

                return me.svg.getAttribute("height");
            },
            set: function (value) {
                var me = internals.get(this);

                me.svg.setAttribute("height", value);
            }
        });
        Object.defineProperty(VisitTree.prototype, "width", {
            get: function () {
                var me = internals.get(this);

                return me.svg.getAttribute("width");
            },
            set: function (value) {
                var me = internals.get(this);

                me.svg.setAttribute("width", value);
            }
        });
        Object.defineProperty(VisitTree.prototype, "visit", {
            set: function (value) {
                var me = internals.get(this);

                me.visit = value;

                this.dispatchEvent(new Event("visitChanged"));
            }
        });

        function convert(visit) {
            return {
                visit: visit,
                children: visit.uniqueChildren.size ? [...visit.uniqueChildren].map(convert) : null
            };
        }
        function build(e) {
            var me = internals.get(this);

            var d3svg = d3.select(me.svg);
            d3svg.selectAll("g").remove();

            var treeLayout = d3.tree().size([this.width, this.height]);
            var root = d3.hierarchy(convert(me.visit));

            treeLayout(root);

            var g = d3svg.append("g");
            var nodes = g.append("g");
            var links = g.append("g");

            var node = nodes
                .selectAll()
                .data(root.descendants())
                .enter()
                .append("g")
                .attr("transform", function (d) {
                    return "translate(" + d.y + "," + d.x + ")"
                });

            node
                .append("rect")
                .attr("width", 10)
                .attr("height", 10);

            node.append("title").text(function (d) {
                return d.data.visit.history.url;
            });

            var text = node
                .append("text")
                .text(function (d) {
                    return d.data.visit.history.name;
                });

            var d3Line = d3
                .line()
                .x(function (d) { return d.x })
                .y(function (d) { return d.y })
                .curve(d3.curveBasis);

            var linePath = function (d) {
                var t = (d.target.y - d.source.y) / 3;

                return d3Line(
                    [
                        {
                            x: d.source.y, y: d.source.x
                        },
                        {
                            x: d.source.y + t, y: d.source.x
                        },
                        {
                            x: d.target.y - t, y: d.target.x
                        },
                        {
                            x: d.target.y, y: d.target.x
                        }
                    ]
                );
            };

            links
                .selectAll()
                .data(root.links())
                .enter()
                .append("path")
                .attr("d", linePath);
        }

        document.registerElement("ChromeHistory-VisitTree", VisitTree);
    });
})(document.currentScript);