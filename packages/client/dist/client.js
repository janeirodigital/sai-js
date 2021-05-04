"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
class Client {
    constructor() { }
    static getInstance() {
        if (!Client.instance) {
            Client.instance = new Client();
        }
        else {
            return Client.instance;
        }
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map