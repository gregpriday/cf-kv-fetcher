import { KVStore } from "./dev-kv-store.js";

export class Fetcher {
    constructor(kvStore = null) {
        // Use the provided KV_STORE if it exists, otherwise create a development version
        this.kv = kvStore || new KVStore();
    }

    async fetch(requestUrl) {
        const key = await this.createKey(requestUrl);
        const kvData = await this.kv.get(key, { type: "json" });

        const serverDataPromise = this.fetchFromServer(requestUrl);

        let data;
        let server;

        if (kvData !== null) {
            // If we have KV data, we can return it immediately and let the frontend wait for the server response
            data = kvData;
            server = serverDataPromise;
        }
        else {
            // If we don't have KV data, we need to wait for the server response
            data = await serverDataPromise;
            server = null;
        }

        return {
            data,
            server,
        };
    }

    async fetchAll(requestUrls) {
        return Promise.all(requestUrls.map(url => this.fetch(url)));
    }

    async fetchAndGroup(urlMap) {
        const urlKeys = Object.keys(urlMap);
        const fullUrls = urlKeys.map(key => urlMap[key]);

        const responses = await this.fetchAll(fullUrls);

        const data = {};
        const server = {};

        for (let i = 0; i < urlKeys.length; i++) {
            const key = urlKeys[i];
            data[key] = await responses[i].data;
            server[key] = responses[i].server;
        }

        return {
            data,
            server
        };
    }

    async fetchFromServer(url) {
        const key = await this.createKey(url);
        let kvData = await this.kv.get(key, { type: "json" });

        // Start by fetching data from the server
        let serverData;
        try {
            const response = await fetch(url);

            if (!response.ok) {
                // Handle HTTP errors
                throw new Error('HTTP Error: ' + response.status);
            }

            serverData = await response.json(); // get server data
        } catch (e) {
            // Handle fetch and other errors by logging and returning cached data if it exists
            console.error('Fetching error:', e.message);
            if (kvData) { // Return cached data if fetch failed but cache exists
                return kvData;
            }
            throw e; // Re-throw if no cached data is available
        }

        // Proceed with caching logic only if serverData was fetched successfully
        try {
            const newHash = await this.computeHash(JSON.stringify(serverData));

            // Only update KV if there is a change
            if (!kvData || newHash !== kvData.hash) {
                await this.kv.put(key, JSON.stringify({ ...serverData, hash: newHash }), { expirationTtl: 31536000 });
            }
        } catch (e) {
            console.error('Error during caching logic:', e.message);
        }

        return serverData; // Return the fresh (or updated) server data
    }

    async computeHash(data) {
        const encoder = new TextEncoder();
        const dataAsUint8Array = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataAsUint8Array);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async createKey(requestUrl) {
        return await this.computeHash(requestUrl);
    }
}
