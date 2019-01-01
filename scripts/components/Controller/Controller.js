(function (currentScript) {
    require(["DB"], function (DB) {
        "use strict";

        var internals = new WeakMap;

        class Controller extends HTMLElement {
            createdCallback() {
                var shadow = this.createShadowRoot();

                var template = currentScript.ownerDocument.querySelector("template");
                var clone = document.importNode(template.content, true);

                shadow.appendChild(clone);

                this.query.addEventListener("change", change.bind(this));
                this.select.addEventListener("selectedVisitChanged", selectedVisitChanged.bind(this));
                
                new DB("wikipedia.org/wiki", dbReady.bind(this), dbProgress.bind(this));
            }
        }

        Object.defineProperty(Controller.prototype, "query", {
            get: function () {
                return document.getElementById(this.getAttribute("query"));
            }
        });
        Object.defineProperty(Controller.prototype, "select", {
            get: function () {
                return document.getElementById(this.getAttribute("select"));
            }
        });
        Object.defineProperty(Controller.prototype, "tree", {
            get: function () {
                return document.getElementById(this.getAttribute("tree"));
            }
        });
        Object.defineProperty(Controller.prototype, "progress", {
            get: function () {
                return document.getElementById(this.getAttribute("progress"));
            }
        });

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

        document.registerElement("ChromeHistory-Controller", Controller);
    });
})(document.currentScript);