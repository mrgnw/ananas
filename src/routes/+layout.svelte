<script>import "../app.pcss";
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();</script>
<svelte:head>
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-180.png">
<link rel="manifest" href="/manifest.webmanifest">
</svelte:head>
{@render children?.()}