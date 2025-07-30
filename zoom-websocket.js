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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var dotenv = require("dotenv");
dotenv.config();
// Use require so WebSocket is the real constructor
var WebSocket = require('ws');
var _a = process.env, SUBSCRIPTION_ID = _a.SUBSCRIPTION_ID, ACCOUNT_ID = _a.ACCOUNT_ID, CLIENT_ID = _a.CLIENT_ID, CLIENT_SECRET = _a.CLIENT_SECRET;
if (!SUBSCRIPTION_ID || !ACCOUNT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing one of ZOOM env vars: SUBSCRIPTION_ID, ACCOUNT_ID, CLIENT_ID, CLIENT_SECRET');
}
var OAUTH_URL = 'https://zoom.us/oauth/token';
var WS_BASE = 'wss://ws.zoom.us/ws';
var heartbeatTimer;
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function () {
        var creds, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    creds = Buffer.from("".concat(CLIENT_ID, ":").concat(CLIENT_SECRET)).toString('base64');
                    return [4 /*yield*/, axios_1.default.post("".concat(OAUTH_URL, "?grant_type=account_credentials&account_id=").concat(ACCOUNT_ID), null, { headers: { Authorization: "Basic ".concat(creds) } })];
                case 1:
                    resp = _a.sent();
                    return [2 /*return*/, resp.data.access_token];
            }
        });
    });
}
function connectZoom() {
    return __awaiter(this, void 0, void 0, function () {
        var token, url, ws_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getAccessToken()];
                case 1:
                    token = _a.sent();
                    url = "".concat(WS_BASE, "?subscriptionId=").concat(SUBSCRIPTION_ID, "&access_token=").concat(token);
                    console.log('🔗 Connecting to', url);
                    ws_1 = new WebSocket(url);
                    ws_1.on('open', function () {
                        console.log('✅ WebSocket OPEN');
                        // send a JSON “heartbeat” every 10s
                        heartbeatTimer = setInterval(function () {
                            if (ws_1.readyState === WebSocket.OPEN) {
                                ws_1.send(JSON.stringify({ module: 'heartbeat' }));
                                console.log('❤️ heartbeat sent');
                            }
                        }, 10000);
                    });
                    ws_1.on('message', function (data) {
                        try {
                            var msg = JSON.parse(data.toString());
                            if (msg.module === 'heartbeat_response') {
                                console.log('💓 heartbeat received');
                            }
                            else {
                                console.log('📨', msg);
                            }
                        }
                        catch (_a) {
                            // non-JSON or unexpected payload
                            console.log('📨 raw:', data.toString());
                        }
                    });
                    ws_1.on('error', function (err) {
                        console.error('⚠️ WebSocket ERROR', err);
                        ws_1.close();
                    });
                    ws_1.on('close', function (code, reason) {
                        console.warn("\u274C CLOSED ".concat(code, " \u2014 ").concat(reason.toString()));
                        clearInterval(heartbeatTimer);
                        setTimeout(connectZoom, 5000);
                    });
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    console.error('🔄 retrying after error', err_1);
                    setTimeout(connectZoom, 5000);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
connectZoom();
