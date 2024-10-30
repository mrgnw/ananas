import { type RequestEvent } from "@sveltejs/kit";
import { SDK, Config } from "@corbado/node-sdk";
import { redirect, error } from "@sveltejs/kit";
import { CORBADO_API_SECRET } from '$env/static/private';
import { PUBLIC_CORBADO_PROJECT_ID } from '$env/static/public';

// Add edge runtime declaration
export const runtime = 'edge';

// Move SDK initialization outside of the function
let sdk: SDK;
try {
	const config = new Config(
		PUBLIC_CORBADO_PROJECT_ID,
		CORBADO_API_SECRET,
		`https://${PUBLIC_CORBADO_PROJECT_ID}.frontendapi.cloud.corbado.io`,
		"https://backendapi.cloud.corbado.io",
	);
	sdk = new SDK(config);
} catch (initError) {
	console.error('SDK initialization failed:', {
		error: initError instanceof Error ? initError.message : String(initError),
		projectId: PUBLIC_CORBADO_PROJECT_ID
	});
}

export async function load({ request }: RequestEvent) {
	try {
		// Check if SDK initialized successfully
		if (!sdk) {
			throw error(500, 'Authentication service unavailable');
		}

		// Check session
		const cookies = parseCookies(request.headers.get("Cookie") || "");
		const sessionToken = cookies.cbo_session_token;

		if (sessionToken) {
			try {
				await sdk.sessions().validateToken(sessionToken);
				redirect(302, "/user");
			} catch (validationError) {
				return { 
					authenticated: false,
					error: 'Invalid session'
				};
			}
		}

		return { authenticated: false };
	} catch (e) {
		// Log only serializable data
		const errorDetails = {
			type: e instanceof Error ? e.name : 'UnknownError',
			message: e instanceof Error ? e.message : String(e)
		};
		
		console.error('Auth error:', errorDetails);
		
		throw error(500, {
			message: errorDetails.message,
			type: errorDetails.type
		});
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