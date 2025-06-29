import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, request, locals, params }) => {
  // Get all the data we want to highlight
  const props = {
    ip_country: locals.ip_country || null,
    accept_language: request.headers.get('accept-language'),
    countryInfo: locals.countryInfo || null,
    allHeaders: Object.fromEntries(request.headers.entries()),
    testQueryResult: {
      fruit: url.searchParams.get('fruit') || 'banana'
    },
    user: locals.user || null,
    userPreferences: locals.userPreferences || null
  };

  let highlightedPropsJson: string;
  
  try {
    // Try to use Shiki for syntax highlighting
    const { codeToHtml } = await import('shiki');
    highlightedPropsJson = await codeToHtml(
      JSON.stringify(props, null, 2),
      {
        lang: 'json',
        theme: 'catppuccin-latte'
      }
    );
  } catch (error) {
    // Fallback to plain HTML with <pre> if Shiki fails (e.g., in Cloudflare Workers)
    console.warn('Shiki highlighting failed, using plain text fallback:', error);
    highlightedPropsJson = `<pre><code>${JSON.stringify(props, null, 2)}</code></pre>`;
  }

  return {
    ...props,
    highlightedPropsJson
  };
};