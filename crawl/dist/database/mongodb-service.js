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
var mongoose = require('mongoose');
var CONFIG = require('@config/config');
var logger = require('@utils/logger').defaultLogger;
/**
 * MongoDB 연결만을 담당하는 서비스 클래스
 * 싱글톤 패턴으로 구현하여 애플리케이션 전체에서 하나의 인스턴스만 사용
 */
var MongoDBService = /** @class */ (function () {
    function MongoDBService() {
        var _this = this;
        // 싱글톤 인스턴스 확인
        if (MongoDBService.instance) {
            return MongoDBService.instance;
        }
        this.mongoose = mongoose;
        this.isConnected = false;
        this.connectionPromise = null;
        // config 또는 환경변수에서 연결 정보 가져오기
        this.uri = process.env.MONGODB_ADMIN_URI || CONFIG.DATABASE.MONGODB_URI;
        this.dbName = process.env.MONGODB_DB_NAME || CONFIG.DATABASE.MONGODB_DB_NAME;
        // 싱글톤 인스턴스 저장
        MongoDBService.instance = this;
        // 연결 이벤트 리스너 설정
        mongoose.connection.on('connected', function () {
            logger.debug('MongoDB 연결 성공');
            _this.isConnected = true;
        });
        mongoose.connection.on('disconnected', function () {
            logger.debug('MongoDB 연결이 끊어졌습니다.');
            _this.isConnected = false;
        });
        mongoose.connection.on('error', function (err) {
            logger.debug('MongoDB 연결 오류:', err);
        });
    }
    /**
     * MongoDB 연결 URI 변경
     * @param {string} uri 새 MongoDB 연결 URI
     */
    MongoDBService.prototype.setUri = function (uri) {
        this.uri = uri;
        if (this.isConnected) {
            logger.debug('MongoDB 연결 URI가 변경되었습니다. 연결을 재설정하려면 disconnect() 후 connect()를 호출하세요.');
        }
        return this;
    };
    /**
     * MongoDB 데이터베이스 이름 변경
     * @param {string} dbName 새 데이터베이스 이름
     */
    MongoDBService.prototype.setDbName = function (dbName) {
        this.dbName = dbName;
        if (this.isConnected) {
            logger.warn('MongoDB 데이터베이스 이름이 변경되었습니다. 연결을 재설정하려면 disconnect() 후 connect()를 호출하세요.');
        }
        return this;
    };
    /**
     * MongoDB에 연결합니다.
     * @returns {Promise<mongoose.Connection>} MongoDB 연결 객체
     */
    MongoDBService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isConnected) {
                            return [2 /*return*/, mongoose.connection];
                        }
                        // 이미 연결 중인 경우 진행 중인 Promise 반환
                        if (this.connectionPromise) {
                            return [2 /*return*/, this.connectionPromise];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        logger.debug("MongoDB\uC5D0 \uC5F0\uACB0 \uC911... URI: ".concat(this.uri, ", DB: ").concat(this.dbName));
                        this.connectionPromise = mongoose.connect(this.uri, {
                            dbName: this.dbName,
                            useNewUrlParser: true,
                            useUnifiedTopology: true,
                            serverSelectionTimeoutMS: 15000, // 서버 선택 제한 시간 15초
                            connectTimeoutMS: 30000, // 연결 제한 시간 30초
                        });
                        return [4 /*yield*/, this.connectionPromise];
                    case 2:
                        _a.sent();
                        this.connectionPromise = null;
                        this.isConnected = true;
                        return [2 /*return*/, mongoose.connection];
                    case 3:
                        error_1 = _a.sent();
                        this.connectionPromise = null;
                        logger.error('MongoDB 연결 실패:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * MongoDB 연결을 종료합니다.
     */
    MongoDBService.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, mongoose.disconnect()];
                    case 2:
                        _a.sent();
                        this.isConnected = false;
                        logger.debug('MongoDB 연결 종료됨');
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        logger.error('MongoDB 연결 종료 중 오류:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 현재 MongoDB 연결 상태를 반환합니다.
     * @returns {boolean} 연결 상태
     */
    MongoDBService.prototype.getConnectionStatus = function () {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
            uri: this.uri,
            dbName: this.dbName
        };
    };
    /**
     * Mongoose 인스턴스를 반환합니다.
     * @returns {mongoose} Mongoose 인스턴스
     */
    MongoDBService.prototype.getMongoose = function () {
        return mongoose;
    };
    /**
     * 현재 연결된 데이터베이스 객체를 반환합니다.
     * @returns {mongoose.Connection} Mongoose 연결 객체
     */
    MongoDBService.prototype.getConnection = function () {
        return mongoose.connection;
    };
    return MongoDBService;
}());
// 싱글톤 인스턴스 초기화
MongoDBService.instance = null;
// 서비스 인스턴스 생성 및 내보내기
var mongoService = new MongoDBService();
module.exports = {
    MongoDBService: MongoDBService,
    mongoService: mongoService // 편의를 위해 기본 인스턴스도 내보냄
};
