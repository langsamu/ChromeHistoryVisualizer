var extend = this.extend || function (derived, base) {
    //for (var p in base) if (base.hasOwnProperty(p)) derived[p] = base[p];
    derived.prototype = Object.create(base.prototype);
    derived.prototype.constructor = derived;
};

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
