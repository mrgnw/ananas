import { type RequestEvent } from "@sveltejs/kit";
import { SDK, Config } from "@corbado/node-sdk";
import { redirect } from "@sveltejs/kit";
import { CORBADO_API_SECRET } from '$env/static/private';
import { PUBLIC_CORBADO_PROJECT_ID } from '$env/static/public';

const config = new Config(
    PUBLIC_CORBADO_PROJECT_ID,
    CORBADO_API_SECRET,
    `https://${PUBLIC_CORBADO_PROJECT_ID}.frontendapi.cloud.corbado.io`,
    "https://backendapi.cloud.corbado.io",
);

const sdk = new SDK(config);
 
export async function load({ request }: RequestEvent) {
    try {
        const cookies = parseCookies(request.headers.get("Cookie") || "");
        const sessionToken: string | undefined = cookies.cbo_session_token;
        
        console.log('Auth page load - Session token:', sessionToken ? 'Present' : 'Missing');
        console.log('Project ID:', PUBLIC_CORBADO_PROJECT_ID);
        
        if (sessionToken) {
            try {
                const user = await sdk.sessions().validateToken(sessionToken);
                console.log('Valid session found, redirecting to /user');
                redirect(302, "/user");
            } catch (validationError) {
                console.error('Session validation error:', validationError);
                return { authenticated: false, error: 'Invalid session' };
            }
        }
        
        return { authenticated: false };
    } catch (error) {
        console.error('Auth page load error:', error);
        // Instead of throwing 500, return error info for debugging
        return {
            authenticated: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorDetail: error
        };
    }
}
 
function parseCookies(cookieHeader: string): Record<string, string> {
    return Object.fromEntries(
        cookieHeader.split(";").map((cookie) => {
            const [name, ...rest] = cookie.trim().split("=");
            return [name, rest.join("=")];
        }),
    );
}