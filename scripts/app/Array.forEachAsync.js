define(function () {
    "use strict";

    window.requestIdleCallback = window.requestIdleCallback || function (callback) {
        var endTime = Date.now() + 100;

        return requestAnimationFrame(function () {
            callback({
                didTimeout: false,
                timeRemaining: function () {
                    return Math.max(0, endTime - Date.now());
                }
            });
        });
    };

    var noOp = function () { };
    var ensureFunction = function (object) {
        if (!Function.prototype.isPrototypeOf(object)) {
            throw new TypeError(object + " is not a function");
        }
    };

    Array.prototype.forEachAsync = function (callback, progress, done, thisArg) {
        progress = progress || noOp;
        done = done || noOp;

        ensureFunction(callback);
        ensureFunction(progress);
        ensureFunction(done);

        var i = 0;
        var that = this;
        var length = that.length;

        function iterator(deadline) {
            while (length > i && deadline.timeRemaining()) {
                callback.call(thisArg, that[i++], i, that);
            }

            progress.call(that, i / length);

            if (length > i) {
                requestIdleCallback(iterator);
            } else {
                done.call(that);
            }
        }

        requestIdleCallback(iterator);
    };
});