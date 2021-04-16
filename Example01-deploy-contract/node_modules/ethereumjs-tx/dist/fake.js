"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ethereumjs_util_1 = require("ethereumjs-util");
var buffer_1 = require("buffer");
var transaction_1 = require("./transaction");
/**
 * Creates a new transaction object that doesn't need to be signed.
 *
 * @param data - A transaction can be initialized with its rlp representation, an array containing
 * the value of its fields in order, or an object containing them by name.
 *
 * @param opts - The transaction's options, used to indicate the chain and hardfork the
 * transactions belongs to.
 *
 * @see Transaction
 */
var FakeTransaction = /** @class */ (function (_super) {
    __extends(FakeTransaction, _super);
    function FakeTransaction(data, opts) {
        if (data === void 0) { data = {}; }
        if (opts === void 0) { opts = {}; }
        var _this = _super.call(this, data, opts) || this;
        Object.defineProperty(_this, 'from', {
            enumerable: true,
            configurable: true,
            get: function () { return _this.getSenderAddress(); },
            set: function (val) {
                if (val) {
                    _this._from = ethereumjs_util_1.toBuffer(val);
                }
            },
        });
        var txData = data;
        if (txData.from) {
            _this.from = ethereumjs_util_1.toBuffer(txData.from);
        }
        return _this;
    }
    /**
     * Computes a sha3-256 hash of the serialized tx, using the sender address to generate a fake
     * signature.
     *
     * @param includeSignature - Whether or not to include the signature
     */
    FakeTransaction.prototype.hash = function (includeSignature) {
        if (includeSignature === void 0) { includeSignature = true; }
        if (includeSignature && this._from && this._from.toString('hex') !== '') {
            // include a fake signature using the from address as a private key
            var fakeKey = buffer_1.Buffer.concat([this._from, this._from.slice(0, 12)]);
            this.sign(fakeKey);
        }
        return _super.prototype.hash.call(this, includeSignature);
    };
    return FakeTransaction;
}(transaction_1.default));
exports.default = FakeTransaction;
//# sourceMappingURL=fake.js.map