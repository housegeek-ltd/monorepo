"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const Response_1 = __importDefault(require("./Response"));
function setRouteHandler(routing, urlParts, method, handler) {
    const part = urlParts.shift();
    if (!part) {
        return routing.handlers.push([method, handler]);
    }
    const nextRouting = routing.routes.get(part) || {
        routes: new Map(),
        handlers: []
    };
    setRouteHandler(nextRouting, urlParts, method, handler);
    routing.routes.set(part, nextRouting);
}
function getRouteHandlers(routing, urlParts, methods = ['all'], handlers = [], params = {}) {
    for (const [method, handler] of routing.handlers) {
        if (methods.includes(method)) {
            handlers.push([handler, params]);
        }
    }
    const part = urlParts[0];
    if (part === void 0)
        return handlers;
    for (const [key, value] of routing.routes) {
        if (key === part) {
            getRouteHandlers(value, urlParts.slice(1), methods, handlers, params);
            continue;
        }
        if (key.charAt(0) === ':') {
            const paramKey = key.slice(1);
            getRouteHandlers(value, urlParts.slice(1), methods, handlers, Object.assign({}, params, { [paramKey]: key }));
            continue;
        }
    }
    return handlers;
}
class Server extends http_1.default.Server {
    constructor() {
        super();
        this.routing = { handlers: [], routes: new Map() };
        this.on('request', this.handleRequest);
    }
    use(arg0, arg1) {
        const [path, handler] = typeof arg0 === 'string'
            ? [arg0, arg1]
            : ['/', arg0];
        setRouteHandler(this.routing, path.split('/'), 'all', handler);
    }
    route(path, method, handler) {
        setRouteHandler(this.routing, path.split('/'), method, handler);
    }
    handleRequest(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = Object.assign(response, {
                append: Response_1.default.prototype.append.bind(response),
                status: Response_1.default.prototype.status.bind(response),
                send: Response_1.default.prototype.send.bind(response),
                json: Response_1.default.prototype.json.bind(response),
                setHeader: Response_1.default.prototype.setHeader.bind(response),
                end: Response_1.default.prototype.end.bind(response)
            });
            if (!request.url || !request.method) {
                return res.status(400).end();
            }
            const { url, method } = request;
            const handlers = getRouteHandlers(this.routing, url.split('/'), ['all', method]);
            let unHandledError;
            for (const [handler, params] of handlers) {
                const req = Object.assign(request, {
                    params
                });
                yield new Promise((resolve, reject) => {
                    if (handler.length === 3 && !unHandledError) {
                        return handler.bind(this)(req, res, err => {
                            if (err)
                                return reject(err);
                            return resolve();
                        });
                    }
                    if (unHandledError) {
                        handler.bind(this)(unHandledError, req, res, err => {
                            if (err)
                                return reject(err);
                            return resolve();
                        });
                        unHandledError = void 0;
                    }
                }).catch(err => {
                    unHandledError = err;
                });
            }
            if (!res.finished) {
                if (!res.headersSent) {
                    res.status(404);
                }
                res.end();
            }
        });
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map