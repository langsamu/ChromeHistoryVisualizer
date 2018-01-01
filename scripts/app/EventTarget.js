define(function () {
    "use strict";

    var internals = new WeakMap;

    class EventTarget {
        constructor() {
            internals.set(this, {
                events: new Map
            });
        }

        addEventListener(type, listener) {
            var me = internals.get(this);

            var listeners = me.events.get(type);

            if (!listeners) {
                listeners = new Set;

                me.events.set(type, listeners);
            }

            listeners.add(listener);
        }

        dispatchEvent(evt) {
            var me = internals.get(this);

            var listeners = me.events.get(evt.type);

            if (listeners) {
                listeners.forEach((listener) => listener.call(this, evt));
            }
        }

        removeEventListener(type, listener) {
            var me = internals.get(this);

            var listeners = me.events.get(type);

            if (listeners) {
                listeners.delete(listener);
            }
        }
    }

    return EventTarget;
});