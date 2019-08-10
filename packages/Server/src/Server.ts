import http from 'http'
import Response from './Response'
import Request, { requestParams } from './Request'

export declare type reqHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: (error ?: string) => void
) => void

export declare type errHandler = (
    error: Error,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: (error ?: string) => void
) => void

export declare interface routing {
    routes: Map<string, routing>
    handlers: Array<[string, reqHandler | errHandler]>
}

function setRouteHandler (routing: routing, urlParts: Array<string>, method: string, handler: reqHandler | errHandler) {
    const part = urlParts.shift()

    if (!part) {
        return routing.handlers.push([method, handler])
    }

    const nextRouting = routing.routes.get(part) || {
        routes: new Map(),
        handlers: []
    }

    setRouteHandler(nextRouting, urlParts, method, handler)
    routing.routes.set(part, nextRouting)
}

function getRouteHandlers (
    routing: routing,
    urlParts: Array<string>,
    methods: Array<string> = ['all'],
    handlers: Array<[reqHandler | errHandler, requestParams]> = [],
    params: requestParams = {}
): Array<[reqHandler | errHandler, requestParams]> {
    for (const [method, handler] of routing.handlers) {
        if (methods.includes(method)) {
            handlers.push([handler, params])
        }
    }

    const part = urlParts[0]
    if (part === void 0) return handlers

    for (const [key, value] of routing.routes) {
        if (key === part) {
            getRouteHandlers(value, urlParts.slice(1), methods, handlers, params)
            continue
        }
        if (key.charAt(0) === ':') {
            const paramKey = key.slice(1)
            getRouteHandlers(value, urlParts.slice(1), methods, handlers, { ...params, [paramKey]: key })
            continue
        }
    }

    return handlers
}

export default class Server extends http.Server {
    routing: routing = { handlers: [], routes: new Map() }

    constructor() {
        super()

        this.on('request', this.handleRequest)
    }

    use (handler: reqHandler | errHandler): void
    use (path: string, handler: reqHandler | errHandler): void
    use (arg0: string | reqHandler | errHandler, arg1?: reqHandler | errHandler) {
        const [path, handler] = typeof arg0 === 'string'
            ? [arg0, arg1]
            : ['/', arg0]

        setRouteHandler(this.routing, path.split('/'), 'all', handler as reqHandler | errHandler)
    }

    async handleRequest (request: Request, response: Response) {
        const res: Response = Object.assign(
            response,
            {
                append: Response.prototype.append.bind(response),
                status: Response.prototype.status.bind(response),
                send: Response.prototype.send.bind(response),
                json: Response.prototype.json.bind(response),
                setHeader: Response.prototype.setHeader.bind(response),
                end: Response.prototype.end.bind(response)
            }
        )

        if (!request.url || !request.method) {
            return res.status(400).end()
        }

        const { url, method } = request
        const handlers = getRouteHandlers(this.routing, url.split('/'), ['all', method])

        let unHandledError: Error | undefined
        for (const [handler, params] of handlers) {
            const req: Request = Object.assign(
                request,
                {
                    params
                }
            )

            await new Promise((resolve, reject) => {
                if (handler.length === 3 && !unHandledError) {
                    return (handler as reqHandler).bind(this)(req, res, err => {
                        if (err) return reject(err)
                        return resolve()
                    })
                }
                if (unHandledError) {
                    (handler as errHandler).bind(this)(unHandledError, req, res, err => {
                        if (err) return reject(err)
                        return resolve()
                    })
                    unHandledError = void 0
                }
            }).catch(err => {
                unHandledError = err
            })
        }

        if (!res.finished) {
            if (!res.headersSent) {
                res.status(404)
            }
            res.end()
        }
    }
}