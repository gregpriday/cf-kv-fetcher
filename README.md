# cf-kv-fetcher

`cf-kv-fetcher` is an NPM package that provides a convenient way to fetch data from a server endpoint while utilizing Cloudflare KV for caching and ensuring data freshness. Designed to speed up dynamic SvelteKit applications, `cf-kv-fetcher` provides a simple API for fetching data and managing it in your Svelte components.

## Features

- Seamless integration with SvelteKit for server-side rendering.
- Efficient data fetching with Cloudflare KV as a caching layer.
- Straightforward API for fetching and managing data.

## Installation

Using npm:

```bash
npm install cf-kv-fetcher
```

## Usage

### Fetching Data in SvelteKit

In your SvelteKit `load` function:

```javascript
import { env } from "$env/dynamic/public";
import { error } from "@sveltejs/kit";
import { Fetcher } from "cf-kv-fetcher";

export async function load({ fetch, platform }) {
    const apiUrl = `${env.PUBLIC_API_URL}/`;
    const fetcher = new Fetcher(platform.env.CF_KV_NAMESPACE);

    const { data, server } = await fetcher.fetchAndGroup({
        projects: apiUrl
    });

    // ... additional logic to handle fetched data
}
```

### Using DataManager in +page.svelte

To manage and reactively update your Svelte components with fetched data:

```svelte
<script>
    import { DataManager } from "cf-kv-fetcher";
    import ProjectGrid from "$lib/components/projects/ProjectGrid.svelte";
    import Hero from "$lib/components/home/Hero.svelte";
    import Pagination from "$lib/components/common/Pagination.svelte";

    export let data = {};
    const dm = new DataManager();

    let projects;
    let pagination;

    $: if (data) {
        dm.set(data);
        // This will trigger a refresh of projects when the fresh server data is available.
        projects = dm.load('projects.data', updatedProjects => {
            projects = updatedProjects;
        });
        pagination = dm.load('projects.pagination', updatedPagination => {
            pagination = updatedPagination;
        });
    }
</script>

<!-- Your template HTML goes here -->
```

### Handling Multiple Endpoints

When your SvelteKit application needs to handle multiple related endpoints:

```javascript
import { Fetcher } from "cf-kv-fetcher";
import { env } from "$env/dynamic/public";
import { error } from "@sveltejs/kit";

export async function load({ params, platform }) {
    const { slug } = params;
    const baseUrl = `${env.PUBLIC_API_URL}/project/${slug}`;  // Construct the API URL
    const fetcher = new Fetcher();

    const { data, server } = await fetcher.fetchAndGroup({
        project: `${baseUrl}`,
        similar: `${baseUrl}/similar`,
        sponsors: `${baseUrl}/sponsors`,
    });

    // Check if this is a 404
    if (data.project && data.project.status === 404) {
        throw error(404, { message: 'Not Found' });
    }

    return {
        ...data,
        server
    };
}
```

```svelte
<script>
    import { DataManager } from "cf-kv-fetcher";
    // ... import your Svelte components

    export let data;
    const dm = new DataManager();

    let project;
    let similar;
    let sponsors;

    $: if(data) {
        dm.set(data);
        project = dm.load('project.data', d => project = d);
        similar = dm.load('similar.data', d => similar = d);
        sponsors = dm.load('sponsors.data', d => sponsors = d);
    }
</script>

<!-- Your template HTML and reactive statements for updates go here -->
```

## Support

For support, please open an issue on the GitHub repository issue tracker.

## License

This project is licensed under the MIT License.