export class KVStore {
    constructor() {
        this.devKvStore = new Map();
        // This is just for representation. In a real-world application, you'd
        // need to check and expire keys based on their expiration timestamps.
        this.metaStore = new Map();
    }

    async get(key, options = {}) {
        let value = this.devKvStore.get(key);
        if (value === null || value === undefined) {
            return null;
        }

        if (options.type === "json") {
            try {
                return JSON.parse(value);
            } catch (e) {
                // If parsing fails, return raw value
                throw new Error('Failed to parse as JSON');
            }
        }

        return value;
    }

    async put(key, value, options = {}) {
        if (typeof value !== "string") {
            throw new Error('Put only accepts strings.');
        }

        this.devKvStore.set(key, value);
        if (options && options.expirationTTL) {
            // Store the expiration timestamp for the key
            const expireAt = Date.now() + (options.expirationTTL * 1000);
            this.metaStore.set(key, { expireAt });
        }
    }
}
