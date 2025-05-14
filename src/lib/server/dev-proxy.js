import { dev } from '$app/environment';

// Configuration for development proxy
const DEV_WRANGLER_URL = 'http://localhost:8787';

/**
 * Proxies a request to the Wrangler dev server in development mode
 * 
 * @param {string} path - The API path to proxy (without leading slash)
 * @param {Object} options - Fetch options (method, headers, body)
 * @returns {Promise<Response>} - The proxied response
 */
export async function proxyToWrangler(path, options = {}) {
  if (!dev) {
    throw new Error('proxyToWrangler should only be used in development mode');
  }
  
  const url = `${DEV_WRANGLER_URL}/${path}`;
  console.log(`[DEV PROXY] Proxying request to: ${url}`, { method: options.method });
  
  // Log request body for debugging
  if (options.body) {
    try {
      const bodyData = JSON.parse(options.body);
      console.log(`[DEV PROXY] Request body:`, {
        ...bodyData,
        password: bodyData.password ? '[REDACTED]' : undefined
      });
    } catch (e) {
      console.log(`[DEV PROXY] Request body: (non-JSON or parsing error)`);
    }
  }
  
  try {
    const response = await fetch(url, options);
    console.log(`[DEV PROXY] Response status:`, response.status);
    
    if (!response.ok) {
      try {
        // Clone the response to read the body without consuming it
        const clonedResponse = response.clone();
        const errorBody = await clonedResponse.text();
        console.error(`[DEV PROXY] Error response body:`, errorBody);
      } catch (bodyReadError) {
        console.error(`[DEV PROXY] Could not read error response body:`, bodyReadError);
      }
    }
    
    return response;
  } catch (error) {
    console.error(`[DEV PROXY] Error proxying to ${url}:`, error);
    throw error;
  }
}

/**
 * Determines if we should use the Wrangler proxy for database operations
 * When true, API handlers should proxy to Wrangler
 * When false, API handlers should use platform.env directly
 * 
 * @param {Object} platform - The platform object from the request
 * @returns {boolean} - Whether to use the proxy
 */
export function shouldUseWranglerProxy(platform) {
  // In development, if platform.env.DB is not available, use the proxy
  return dev && (!platform?.env?.DB);
}