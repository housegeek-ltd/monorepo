"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const defaults_1 = __importDefault(require("./defaults"));
class Response extends http_1.ServerResponse {
    append(headerKey, value) {
        const header = this.getHeader(headerKey);
        if (header === void 0) {
            if (typeof value === 'string') {
                return this.setHeader(headerKey, value);
            }
            return this.setHeader(headerKey, value.join(', '));
        }
        if (typeof value === 'string') {
            return this.setHeader(headerKey, [header, value].join(', '));
        }
        return this.setHeader(headerKey, [header, ...value].join(', '));
    }
    status(statusCode, statusMessage = defaults_1.default.statusMessage[statusCode]) {
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        return this;
    }
    send(body) {
        if (typeof body === 'string' || body instanceof Buffer) {
            this.write(body);
            return this;
        }
        try {
            const json = JSON.stringify(body);
            this.setHeader('Content-Type', 'application/json');
            this.write(json);
        }
        catch (err) {
            this.write(body.toString instanceof Function
                ? body.toString()
                : `${body}`);
        }
        return this;
    }
    json(body) {
        this.setHeader('Content-Type', 'application/json');
        this.write(JSON.stringify(body));
        return this;
    }
    setHeader(key, value) {
        super.setHeader(key, value);
        return this;
    }
    end() {
        super.end();
        return this;
    }
}
exports.default = Response;
//# sourceMappingURL=Response.js.map