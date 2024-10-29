import { type RequestEvent } from "@sveltejs/kit";
import { SDK, Config } from "@corbado/node-sdk";
import { redirect } from "@sveltejs/kit";
import { CORBADO_API_SECRET } from '$env/static/private';
const config = new Config(
    "pro-4370035767074657014",
    CORBADO_API_SECRET,
    "https://pro-4370035767074657014.frontendapi.cloud.corbado.io",
    "https://backendapi.cloud.corbado.io",
);
const sdk = new SDK(config);
 
export async function load({ request }: RequestEvent) {
    const cookies = parseCookies(request.headers.get("Cookie") || "");
    const sessionToken: string | undefined = cookies.cbo_session_token;
    try {
        if (!sessionToken) {
            throw new Error("No session cookie found");
        }
 
        const user = await sdk.sessions().validateToken(sessionToken);
    } catch {
        // session cookie was invalid
        redirect(302, "/");
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