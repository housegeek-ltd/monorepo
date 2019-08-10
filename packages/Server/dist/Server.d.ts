/// <reference types="node" />
import http from 'http';
import Response from './Response';
import Request from './Request';
export declare type reqHandler = (req: http.IncomingMessage, res: http.ServerResponse, next: (error?: Error) => void) => void;
export declare type errHandler = (error: Error, req: http.IncomingMessage, res: http.ServerResponse, next: (error?: Error) => void) => void;
export declare interface routing {
    routes: Map<string, routing>;
    handlers: Array<[string, reqHandler | errHandler]>;
}
export default class Server extends http.Server {
    routing: routing;
    logger: typeof console;
    constructor({ logger }: {
        logger?: Console | undefined;
    });
    use(handler: reqHandler | errHandler): void;
    use(path: string, handler: reqHandler | errHandler): void;
    route(path: string, method: string, handler: reqHandler | errHandler): void;
    handleRequest(request: Request, response: Response): Response | undefined;
}
