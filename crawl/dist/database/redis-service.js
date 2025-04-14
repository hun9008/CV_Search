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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
require('dotenv');
var createClient = require('redis').createClient;
var RedisService = /** @class */ (function () {
    function RedisService(config) {
        if (config === void 0) { config = {}; }
        this.client = createClient({
            username: 'default',
            password: 'lYMEZAJJVEjG4vxwZ1qp4nNX553vFZvN',
            socket: {
                host: 'redis-13542.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com',
                port: 13542
            }
        });
        this.client.on('error', function (err) { return console.log('Redis Client Error', err); });
        this.isConnected = false;
    }
    RedisService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.isConnected) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.connect()];
                    case 1:
                        _a.sent();
                        this.isConnected = true;
                        console.log('Redis client connected successfully');
                        _a.label = 2;
                    case 2: return [2 /*return*/, this.client];
                }
            });
        });
    };
    RedisService.prototype.set = function (key_1, value_1) {
        return __awaiter(this, arguments, void 0, function (key, value, options) {
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.client.set(key, value, options)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    RedisService.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.client.get(key)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    RedisService.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.disconnect()];
                    case 1:
                        _a.sent();
                        this.isConnected = false;
                        console.log('Redis client disconnected');
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return RedisService;
}());
// 싱글톤 인스턴스 생성
var redisService = new RedisService();
// 예제 사용법을 async 함수로 감싸기
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, redisService.set('foo', 'bar')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, redisService.get('foo')];
                case 2:
                    result = _a.sent();
                    console.log(result); // >>> bar
                    // 테스트 완료 후 연결 종료 (필요시)
                    return [4 /*yield*/, redisService.disconnect()];
                case 3:
                    // 테스트 완료 후 연결 종료 (필요시)
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Redis operation failed:', error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// 필요시 main 함수 실행 (모듈로 사용할 경우 주석 처리)
if (require.main === module) {
    main().catch(function (err) {
        console.error('Failed to execute Redis operations:', err);
        process.exit(1);
    });
}
module.exports = redisService;
