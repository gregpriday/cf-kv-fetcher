export class DataManager {
    constructor() {
    }

    set(data) {
        this.data = data;
    }

    load(path, setter) {
        // Retrieve the initial data
        const initialData = this.resolvePath(this.data, path);

        // Handle server data if it exists
        if (this.resolvePath(this.data, `server.${path.split('.')[0]}`)) {
            this.handleServerData(path, setter);
        }

        return initialData;
    }

    // Asynchronous method to update server data
    async handleServerData(path, setter) {
        // Retrieve promise
        const serverDataPromise = this.resolvePath(this.data, `server.${path.split('.')[0]}`);
        if (serverDataPromise instanceof Promise) {
            this.data.server[path.split('.')[0]] = await serverDataPromise;  // Cache the resolved data
        }

        // Get the updated server data
        const newServerData = this.resolvePath(this.data, `server.${path}`);
        if (newServerData) {
            setter(newServerData);
        }
    }

    // Utility to resolve a string path on an object
    resolvePath(object, path) {
        return path.split('.').reduce((o, k) => o && o[k], object);
    }
}
