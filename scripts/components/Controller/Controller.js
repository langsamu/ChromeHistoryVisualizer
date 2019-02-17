import { default as DB } from "../../app/DB.js";

var internals = new WeakMap;

export default class Controller extends HTMLElement {
    async connectedCallback() {
        const response = await fetch("scripts/components/Controller/index.html");
        this.attachShadow({ mode: "closed" }).innerHTML = await response.text();

        this.query.addEventListener("change", change.bind(this));
        this.select.addEventListener("selectedVisitChanged", selectedVisitChanged.bind(this));

        new DB("wikipedia.org/wiki", dbReady.bind(this), dbProgress.bind(this));
    }

    get query() {
        return document.getElementById(this.getAttribute("query"));
    }

    get select() {
        return document.getElementById(this.getAttribute("select"));
    }

    get tree() {
        return document.getElementById(this.getAttribute("tree"));
    }

    get progress() {
        return document.getElementById(this.getAttribute("progress"));
    }
}

function change() {
    this.select.visits = this.query.results;
}
function selectedVisitChanged() {
    this.tree.visit = this.select.selectedVisit;
}
function dbReady(db) {
    this.query.db = db;
}
function dbProgress(value) {
    this.progress.value = value;
}

window.customElements.define("chromehistory-controller", Controller);
