"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
class Request extends http_1.IncomingMessage {
    constructor() {
        super(...arguments);
        this.params = {};
    }
}
exports.default = Request;
//# sourceMappingURL=Request.js.map