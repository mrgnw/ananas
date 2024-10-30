import { type RequestEvent } from "@sveltejs/kit";
import { SDK, Config } from "@corbado/node-sdk";
import { redirect, error } from "@sveltejs/kit";
import { CORBADO_API_SECRET } from '$env/static/private';
import { PUBLIC_CORBADO_PROJECT_ID } from '$env/static/public';

export async function load({ request }: RequestEvent) {
		try {
				if (!PUBLIC_CORBADO_PROJECT_ID || !CORBADO_API_SECRET) {
						error(500, {
								message: 'Missing Corbado configuration',
								details: {
										hasProjectId: !!PUBLIC_CORBADO_PROJECT_ID,
										hasApiSecret: !!CORBADO_API_SECRET,
										// env: process.env.NODE_ENV
								}
						});
				}

				let sdk;
				try {
						const config = new Config(
								PUBLIC_CORBADO_PROJECT_ID,
								CORBADO_API_SECRET,
								`https://${PUBLIC_CORBADO_PROJECT_ID}.frontendapi.cloud.corbado.io`,
								"https://backendapi.cloud.corbado.io",
						);
						sdk = new SDK(config);
				} catch (sdkError) {
						error(500, {
								message: 'Failed to initialize Corbado SDK',
								error: sdkError instanceof Error ? sdkError.message : 'Unknown SDK error'
						});
				}

				// Check session
				const cookies = parseCookies(request.headers.get("Cookie") || "");
				const sessionToken = cookies.cbo_session_token;

				if (sessionToken) {
						try {
								const user = await sdk.sessions().validateToken(sessionToken);
								redirect(302, "/");
						} catch (validationError) {
								return { 
										authenticated: false,
										error: 'Invalid session token'
								};
						}
				}

				return { authenticated: false };
		} catch (e) {
				console.error('Auth critical error:', {
						error: e,
						message: e instanceof Error ? e.message : 'Unknown error',
						stack: e instanceof Error ? e.stack : undefined,
						env: {
								hasProjectId: !!PUBLIC_CORBADO_PROJECT_ID,
								hasApiSecret: !!CORBADO_API_SECRET
						}
				});

				error(500, {
						message: e instanceof Error ? e.message : 'Unknown server error',
						details: e
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