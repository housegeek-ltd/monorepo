"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const Response_1 = __importDefault(require("./Response"));
function setRouteHandler(routing, urlParts, method, handler) {
    console.log(urlParts);
    const part = urlParts.shift();
    console.log(part);
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
            getRouteHandlers(value, urlParts.slice(1), methods, handlers, Object.assign({}, params, { [paramKey]: part }));
            continue;
        }
    }
    return handlers;
}
class Server extends http_1.default.Server {
    constructor({ logger = console } = {}) {
        super();
        this.routing = { handlers: [], routes: new Map() };
        this.logger = logger;
        this.on('request', this.handleRequest);
    }
    use(arg0, arg1) {
        const [path, handler] = typeof arg0 === 'string'
            ? [arg0, arg1]
            : ['', arg0];
        setRouteHandler(this.routing, path.split('/'), 'all', handler);
    }
    route(path, method, handler) {
        setRouteHandler(this.routing, path.split('/'), method, handler);
    }
    handleRequest(request, response) {
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
        const handlers = getRouteHandlers(this.routing, url.split('/').slice(1), ['all', method]);
        const done = (error) => {
            if (!res.finished) {
                if (!res.headersSent) {
                    res.status(error ? 500 : 404);
                }
                if (error) {
                    this.logger.error(error);
                    res.write(`${error}`);
                }
                res.end();
            }
        };
        const next = (error) => {
            const nextHandler = handlers.shift();
            if (!nextHandler)
                return done(error);
            const [handler, params] = nextHandler;
            const req = Object.assign(request, {
                params
            });
            if (handler.length === 3) {
                if (error)
                    return next(error);
                return handler.bind(this)(req, res, next);
            }
            if (error) {
                return handler.bind(this)(error, req, res, next);
            }
            return next();
        };
        next();
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map