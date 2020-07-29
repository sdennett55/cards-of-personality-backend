"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeckCache = void 0;
;
var DeckCache = /** @class */ (function () {
    function DeckCache(options) {
        this.caches = {};
        if (options) {
            this.set(options);
        }
    }
    DeckCache.prototype.set = function (cache) {
        this.setTTL(cache);
        this.caches[cache.key] = cache;
    };
    DeckCache.prototype.get = function (key) {
        var _a;
        return (_a = this.caches[key]) === null || _a === void 0 ? void 0 : _a.data;
    };
    DeckCache.prototype.clear = function (cache) {
        delete this.caches[cache.key];
    };
    DeckCache.prototype.setTTL = function (cache) {
        var _this = this;
        var timer = setTimeout(function () {
            _this.clear(cache);
        }, cache.ttl * 1000);
        this.caches[cache.key] = __assign(__assign({}, this.caches[cache.key]), { timer: timer });
    };
    return DeckCache;
}());
exports.DeckCache = DeckCache;
