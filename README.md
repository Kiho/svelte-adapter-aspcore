# svelte-adapter-aspcore

Adapter for Svelte apps that runs an ASP.Net Core App.

## Usage

Run `npm install -D svelte-adapter-aspcore`.

Then in your `svelte.config.js`:

```js
import adapter from 'svelte-adapter-aspcore';

export default {
  kit: {
      ...
      adapter: adapter({
      out: 'build'
    })
  }
};
```

See the [demo application](https://github.com/Kiho/aspcore-spa-cli/tree/master/samples/SvelteKitSample) for an example integration with the SvelteKit.
