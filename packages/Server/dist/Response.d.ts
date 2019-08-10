/// <reference types="node" />
import { ServerResponse } from 'http';
export default abstract class Response extends ServerResponse {
    append(headerKey: string, value: Array<string> | string): this;
    status(statusCode: number, statusMessage?: string): this;
    send(body: string | Buffer | Array<any> | object): this;
    json(body: object): this;
    setHeader(key: string, value: string): this;
    end(): this;
}
