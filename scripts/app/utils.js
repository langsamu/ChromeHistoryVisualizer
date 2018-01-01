define(["Array.forEachAsync"], function () {
    "use strict";

    //#region Array

    Array.prototype.orderBy = function (selector, comparer) {
        comparer = comparer || ((a, b) => a - b);

        var mapped = this.map((e, i) => ({ index: i, value: selector(e) }));
        mapped.sort((a, b) => comparer(a.value, b.value));
        return mapped.map(e => this[e.index]);
    }

    Array.prototype.selectMany = function (selector) {
        return this.map(selector).reduce((previousValue, currentValue) => previousValue.concat(currentValue), []);
    };

    Array.prototype.groupBy = function (keySelector) {
        var groups = new Map;

        this.forEach(function (element) {
            var key = keySelector(element);

            if (groups.has(key)) {
                groups.get(key).add(element);
            } else {
                groups.set(key, new Set([element]));
            }
        });

        return groups;
    };

    Object.defineProperty(Array.prototype, "first", {
        get: function () {
            return this[0];
        }
    });

    Object.defineProperty(Array.prototype, "last", {
        get: function () {
            return this[this.length - 1];
        }
    });

    Object.defineProperty(Array.prototype, "distinct", {
        get: function () {
            return [...new Set(this)];
        }
    });

    //#endregion
    //#region toArray

    Map.prototype.toArray = function () {
        return [...this.values()];
    };

    Set.prototype.toArray = function () {
        return [...this];
    };

    //#endregion
    //#region String

    String.prototype.contains = function (searchString) {
        return this.indexOf(searchString) !== -1;
    };

    String.prototype.substringBefore = function (searchString) {
        return this.contains(searchString) ? this.substring(0, this.indexOf(searchString)) : this;
    };

    //#endregion

    NodeList.prototype.forEach = NodeList.prototype.forEach || Array.prototype.forEach;
    HTMLOptionsCollection.prototype.filter = HTMLOptionsCollection.prototype.filter || Array.prototype.filter;

});