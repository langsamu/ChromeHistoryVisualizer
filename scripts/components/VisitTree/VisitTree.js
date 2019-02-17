var internals = new WeakMap;

export default class VisitTree extends HTMLElement {
    async connectedCallback() {
        const me = internals.set(this, {}).get(this);

        const response = await fetch("scripts/components/VisitTree/index.html");
        const shadow = this.attachShadow({ mode: "closed" });
        shadow.innerHTML = await response.text();

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

    get height() {
        const me = internals.get(this);

        return me.svg.getAttribute("height");
    }
    set height(value) {
        const me = internals.get(this);

        me.svg.setAttribute("height", value);
    }

    get width() {
        const me = internals.get(this);

        return me.svg.getAttribute("width");
    }
    set width(value) {
        const me = internals.get(this);

        me.svg.setAttribute("width", value);
    }

    set visit(value) {
        const me = internals.get(this);

        me.visit = value;

        this.dispatchEvent(new Event("visitChanged"));
    }
}

function convert(visit) {
    return {
        visit: visit,
        children: visit.uniqueChildren.size ? [...visit.uniqueChildren].map(convert) : null
    };
}
function build(e) {
    const me = internals.get(this);

    var d3svg = d3.select(me.svg);
    d3svg.selectAll("g").remove();

    const treeLayout = d3.tree().size([this.width, this.height]);
    const root = d3.hierarchy(convert(me.visit));

    treeLayout(root);

    const g = d3svg.append("g");
    const nodes = g.append("g");
    const links = g.append("g");

    const node = nodes
        .selectAll()
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    node
        .append("rect")
        .attr("width", 10)
        .attr("height", 10);

    node.append("title").text(function (d) {
        return d.data.visit.history.url;
    });

    const text = node
        .append("text")
        .text(function (d) {
            return d.data.visit.history.name;
        });

    const d3Line = d3
        .line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .curve(d3.curveBasis);

    const linePath = function (d) {
        const t = (d.target.y - d.source.y) / 3;

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

window.customElements.define("chromehistory-visittree", VisitTree);
