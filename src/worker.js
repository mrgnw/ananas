import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';

const rpName = 'Ananas';

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// Convert UUID string to Uint8Array
function uuidToBytes(uuid) {
    if (!uuid || typeof uuid !== 'string') return new Uint8Array(16);
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

// Convert Uint8Array to base64url string
function bytesToBase64url(bytes) {
    const base64 = btoa(String.fromCharCode.apply(null, bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Convert base64url to Uint8Array
function base64urlToBytes(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - base64url.length % 4) % 4);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

// Export for testing
export const handler = {
    async fetch(request, env) {
        try {
            console.log('Environment:', {
                DB: !!env?.DB,
                env: Object.keys(env || {}),
                platform: request.cf
            });
            const url = new URL(request.url);
            const origin = request.headers.get('origin') || url.origin;
            const rpID = url.hostname;
            const pathname = url.pathname;
            const method = request.method;

            console.log('Request:', { 
                url: url.toString(),
                origin,
                rpID,
                pathname,
                method 
            });

            // Handle CORS preflight
            if (method === 'OPTIONS') {
                return handleOptions(request);
            }

            if (pathname === '/auth/register') {
                if (method === 'POST') {
                    const body = await request.json();
                    console.log('Register POST body:', body);
                    const username = body.username;

                    try {
                        // Check if user exists
                        const existingUser = await env.DB.prepare(
                            'SELECT * FROM users WHERE username = ?'
                        ).bind(username).first();

                        console.log('Existing user:', existingUser);

                        if (existingUser) {
                            return new Response(JSON.stringify({ error: 'Username already exists' }), {
                                status: 400,
                                headers: {
                                    ...corsHeaders,
                                    'Content-Type': 'application/json'
                                }
                            });
                        }

                        // Generate userID
                        const userIDBytes = new Uint8Array(16);
                        crypto.getRandomValues(userIDBytes);
                        const userIDBase64 = bytesToBase64url(userIDBytes);

                        // Generate registration options
                        const options = await generateRegistrationOptions({
                            rpName: 'Ananas',
                            rpID,
                            userID: userIDBytes,
                            userName: username,
                            attestationType: 'none',
                            authenticatorSelection: {
                                residentKey: 'required',
                                userVerification: 'preferred',
                                requireResidentKey: true
                            }
                        });

                        console.log('Registration options:', options);

                        // Create user with challenge
                        await env.DB.prepare(
                            'INSERT INTO users (id, username, current_challenge) VALUES (?, ?, ?)'
                        ).bind(userIDBase64, username, options.challenge).run();

                        // Keep the original options but override user.id with base64url for transport
                        const response = {
                            ...options,
                            user: {
                                id: userIDBase64,  // Send base64url to client
                                name: username,
                                displayName: username
                            }
                        };

                        return new Response(JSON.stringify(response), { 
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json'
                            }
                        });
                    } catch (error) {
                        console.error('Registration error:', error);
                        return new Response(JSON.stringify({ 
                            error: error.message,
                            stack: error.stack
                        }), { 
                            status: 500,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json'
                            }
                        });
                    }
                } else if (method === 'PUT') {
                    const body = await request.json();
                    const { username } = body;

                    console.log('Verifying registration for user:', username);

                    // Get user and challenge
                    const user = await env.DB.prepare(
                        'SELECT * FROM users WHERE username = ?'
                    ).bind(username).first();

                    if (!user || !user.current_challenge) {
                        return new Response(JSON.stringify({ error: 'Invalid registration session' }), {
                            status: 400,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json'
                            }
                        });
                    }

                    const verification = await verifyRegistrationResponse({
                        response: body,
                        expectedChallenge: user.current_challenge,
                        expectedOrigin: origin,
                        expectedRPID: rpID
                    });

                    console.log('Verification result:', verification);

                    if (verification.verified) {
                        // Store credential data
                        const { registrationInfo } = verification;
                        const {
                            credential,
                            credentialDeviceType,
                            credentialBackedUp,
                        } = registrationInfo;

                        // Save authenticator
                        await env.DB.prepare(
                            `INSERT INTO authenticators (
                                id, 
                                user_id, 
                                credential_public_key, 
                                counter,
                                transports,
                                device_type,
                                backed_up
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)`
                        ).bind(
                            credential.id,
                            user.id,
                            credential.publicKey,
                            credential.counter,
                            JSON.stringify(credential.transports),
                            credentialDeviceType,
                            credentialBackedUp
                        ).run();

                        // Clear challenge
                        await env.DB.prepare(
                            'UPDATE users SET current_challenge = NULL WHERE id = ?'
                        ).bind(user.id).run();

                        return new Response(JSON.stringify({ verified: true }), { 
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json'
                            }
                        });
                    }

                    return new Response(JSON.stringify({ verified: false }), { 
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } else if (pathname === '/auth/authenticate') {
                if (method === 'POST') {
                    const body = await request.json();
                    const { username } = body;

                    console.log('Authenticating user:', username);

                    const user = await env.DB.prepare(
                        'SELECT * FROM users WHERE username = ?'
                    ).bind(username).first();

                    if (!user) {
                        return new Response(
                            JSON.stringify({ error: 'User not found' }),
                            { status: 404, headers: corsHeaders }
                        );
                    }

                    // Get authenticator
                    const authenticator = await env.DB.prepare(
                        'SELECT * FROM authenticators WHERE user_id = ?'
                    ).bind(user.id).first();

                    if (!authenticator) {
                        return new Response(
                            JSON.stringify({ error: 'No authenticators registered' }),
                            { status: 400, headers: corsHeaders }
                        );
                    }

                    // Parse authenticator data
                    const parsedAuthenticator = {
                        id: authenticator.id,
                        publicKey: authenticator.credential_public_key,
                        counter: authenticator.counter || 0,
                        transports: JSON.parse(authenticator.transports || '[]')
                    };

                    // Generate authentication options
                    const options = await generateAuthenticationOptions({
                        rpID,
                        userVerification: 'preferred',
                        allowCredentials: [{
                            id: parsedAuthenticator.id,
                            type: 'public-key',
                            transports: parsedAuthenticator.transports
                        }]
                    });

                    console.log('Authentication options:', options);

                    // Save challenge
                    await env.DB.prepare(
                        'UPDATE users SET current_challenge = ? WHERE id = ?'
                    ).bind(options.challenge, user.id).run();

                    return new Response(JSON.stringify(options), {
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                } else if (method === 'PUT') {
                    const body = await request.json();
                    const { username } = body;

                    console.log('Authentication body:', body);
                    console.log('Verifying authentication for user:', username);

                    // Get user and challenge
                    const user = await env.DB.prepare(
                        'SELECT * FROM users WHERE username = ?'
                    ).bind(username).first();

                    if (!user) {
                        return new Response(
                            JSON.stringify({ error: 'User not found' }),
                            { status: 404, headers: corsHeaders }
                        );
                    }

                    if (!user.current_challenge) {
                        return new Response(JSON.stringify({ error: 'Invalid authentication session' }), {
                            status: 400,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json'
                            }
                        });
                    }

                    // Get authenticator for verification
                    const authenticator = await env.DB.prepare(
                        'SELECT * FROM authenticators WHERE user_id = ?'
                    ).bind(user.id).first();

                    console.log('Raw authenticator from DB:', authenticator);

                    if (!authenticator) {
                        return new Response(
                            JSON.stringify({ error: 'No authenticators registered' }),
                            { status: 400, headers: corsHeaders }
                        );
                    }

                    // Parse authenticator data
                    const parsedAuthenticator = {
                        id: authenticator.id,
                        publicKey: authenticator.credential_public_key,
                        counter: authenticator.counter || 0,
                        transports: JSON.parse(authenticator.transports || '[]')
                    };

                    console.log('Parsed authenticator:', parsedAuthenticator);

                    // Verify authentication
                    let verification;
                    try {
                        verification = await verifyAuthenticationResponse({
                            response: body,
                            expectedChallenge: user.current_challenge,
                            expectedOrigin: origin,
                            expectedRPID: rpID,
                            credential: parsedAuthenticator
                        });
                    } catch (error) {
                        console.error('Authentication error:', error);
                        return new Response(
                            JSON.stringify({ error: error.message }),
                            { status: 400, headers: corsHeaders }
                        );
                    }

                    // Update counter
                    const { authenticationInfo } = verification;
                    const { newCounter } = authenticationInfo;

                    await env.DB.prepare(
                        'UPDATE authenticators SET counter = ? WHERE id = ?'
                    ).bind(newCounter, authenticator.id).run();

                    // Create a new session
                    const sessionId = crypto.randomUUID();
                    await env.DB.prepare(
                        'INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, ?)'
                    ).bind(sessionId, user.id, Date.now()).run();

                    // Set session cookie
                    const cookie = `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict`;
                    return new Response(JSON.stringify({ verified: true }), {
                        headers: {
                            'Set-Cookie': cookie,
                            ...corsHeaders,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            }

            return new Response(JSON.stringify({ error: 'Not found' }), { 
                status: 404, 
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }
    }
};

// Handle CORS preflight
function handleOptions(request) {
    if (request.headers.get('Origin') !== null &&
        request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null) {
        return new Response(null, {
            headers: corsHeaders
        });
    } else {
        return new Response(null, {
            headers: {
                Allow: 'GET, POST, PUT, DELETE, OPTIONS',
            },
        });
    }
}

// Default export for Cloudflare
export default handler;
