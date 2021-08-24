"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var hardhat_1 = require("hardhat");
require('dotenv').config();
var provider = new hardhat_1.ethers.providers.JsonRpcProvider(process.env.INFURA_ID);
var poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";
var poolImmutablesAbi = [
    "function factory() external view returns (address)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function fee() external view returns (uint24)",
    "function tickSpacing() external view returns (int24)",
    "function maxLiquidityPerTick() external view returns (uint128)",
];
var poolContract = new hardhat_1.ethers.Contract(poolAddress, poolImmutablesAbi, provider);
function getPoolImmutables() {
    return __awaiter(this, void 0, void 0, function () {
        var accounts, PoolImmutables;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, hardhat_1.ethers.getSigners()];
                case 1:
                    accounts = _b.sent();
                    console.log("Accounts:", accounts.map(function (a) { return a.address; }));
                    _a = {};
                    return [4 /*yield*/, poolContract.factory()];
                case 2:
                    _a.factory = _b.sent();
                    return [4 /*yield*/, poolContract.token0()];
                case 3:
                    _a.token0 = _b.sent();
                    return [4 /*yield*/, poolContract.token1()];
                case 4:
                    _a.token1 = _b.sent();
                    return [4 /*yield*/, poolContract.fee()];
                case 5:
                    _a.fee = _b.sent();
                    return [4 /*yield*/, poolContract.tickSpacing()];
                case 6:
                    _a.tickSpacing = _b.sent();
                    return [4 /*yield*/, poolContract.maxLiquidityPerTick()];
                case 7:
                    PoolImmutables = (_a.maxLiquidityPerTick = _b.sent(),
                        _a);
                    return [2 /*return*/, PoolImmutables];
            }
        });
    });
}
getPoolImmutables().then(function (result) {
    console.log("pool info");
    console.log(result);
    console.log(result.maxLiquidityPerTick.toString());
});
