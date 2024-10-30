import { type RequestEvent } from "@sveltejs/kit";
import { SDK, Config } from "@corbado/node-sdk";
import { redirect } from "@sveltejs/kit";
import { CORBADO_API_SECRET } from '$env/static/private';
import { PUBLIC_CORBADO_PROJECT_ID } from '$env/static/public';

// export const runtime = 'edge';

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
        
        if (sessionToken) {
            const user = await sdk.sessions().validateToken(sessionToken);
            redirect(302, "/user");
        }
        
        return { authenticated: false };
    } catch (error) {
        return { 
            authenticated: false,
            error: error instanceof Error ? error.message : 'Authentication error'
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