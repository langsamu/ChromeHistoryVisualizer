define("util", {
    extend: function (derived, base) {
        /// <param name="derived" type="Function"></param>
        /// <param name="base" type="Function"></param>

        //for (var p in base) if (base.hasOwnProperty(p)) derived[p] = base[p];
        derived.prototype = Object.create(base.prototype);
        derived.prototype.constructor = derived;
    },
    escapeRegExpfunction: function (string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    }
});