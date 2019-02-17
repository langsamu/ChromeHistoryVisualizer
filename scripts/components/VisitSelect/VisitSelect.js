var internals = new WeakMap;

export default class VisitSelect extends HTMLElement {
    async connectedCallback() {
        const me = internals.set(this, {}).get(this);

        const response = await fetch("scripts/components/VisitSelect/index.html");
        const shadow = this.attachShadow({ mode: "closed" });
        shadow.innerHTML = await response.text();

        me.select = shadow.querySelector("select");

        me.select.addEventListener("change", e => this.dispatchEvent(new Event("selectedVisitChanged")));

        this.addEventListener("visitsChanged", build.bind(this));
    }

    get visits() {
        const me = internals.get(this);

        return me.visits;
    }
    set visits(value) {
        const me = internals.get(this);

        me.visits = value;

        this.dispatchEvent(new Event("visitsChanged"));
    }

    get selectedVisit() {
        const me = internals.get(this);

        return me.select.selectedOptions[0].visit;
    }
    set selectedVisit(value) {
        const me = internals.get(this);

        const select = me.select;
        const options = Array.from(select.options);
        const sameVisit = option => option.visit === value;
        const selectedOption = options.filter(sameVisit).first;

        select.selectedIndex = options.indexOf(selectedOption);

        select.dispatchEvent(new Event("selectedVisitChanged"));
    }
}

function build() {
    const me = internals.get(this);

    Array.from(me.select.options).forEach(o => o.remove());

    me.visits.forEach((visit) => {
        const option = document.createElement("option");
        option.text = visit.history.name;
        option.visit = visit;

        me.select.add(option);
    });
}

window.customElements.define("chromehistory-visitselect", VisitSelect);
