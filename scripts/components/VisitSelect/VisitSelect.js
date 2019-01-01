(function (currentScript) {
    require([], function () {
        "use strict";

        var internals = new WeakMap;

        class VisitSelect extends HTMLElement {
            createdCallback() {
                var me = internals.set(this, {}).get(this);

                var shadow = this.createShadowRoot();

                var template = currentScript.ownerDocument.querySelector("template");
                shadow.appendChild(document.importNode(template.content, true));

                me.select = shadow.querySelector("select");

                me.select.addEventListener("change", (e) => {
                    this.dispatchEvent(new Event("selectedVisitChanged"));
                });

                this.addEventListener("visitsChanged", build.bind(this));
            }
        }

        Object.defineProperty(VisitSelect.prototype, "visits", {
            get: function () {
                var me = internals.get(this);

                return me.visits;
            },
            set: function (value) {
                var me = internals.get(this);

                me.visits = value;

                this.dispatchEvent(new Event("visitsChanged"));
            }
        });
        Object.defineProperty(VisitSelect.prototype, "selectedVisit", {
            get: function () {
                var me = internals.get(this);

                return me.select.selectedOptions[0].visit;
            },
            set: function (value) {
                var me = internals.get(this);

                var select = me.select;
                var options = Array.from(select.options);
                var sameVisit = option => option.visit === value;
                var selectedOption = options.filter(sameVisit).first;

                select.selectedIndex = options.indexOf(selectedOption);

                select.dispatchEvent(new Event("selectedVisitChanged"));
            }
        });

        function build() {
            var me = internals.get(this);

            Array.from(me.select.options).forEach(o => o.remove());

            me.visits.forEach((visit) => {
                var option = document.createElement("option");
                option.text = visit.history.name;
                option.visit = visit;

                me.select.add(option);
            });
        }

        document.registerElement("ChromeHistory-VisitSelect", VisitSelect);
    });
})(document.currentScript);