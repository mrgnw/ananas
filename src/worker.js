import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

const rpName = 'Ananas';

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
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Convert base64url to Uint8Array
function base64urlToBytes(base64url) {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
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
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        };

        try {
            console.log('Environment:', {
                DB: !!env?.DB,
                env: Object.keys(env || {}),
                platform: request.cf
            });
            const url = new URL(request.url);
            const origin = url.origin;
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
                return new Response(null, { headers: corsHeaders });
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
                                headers: corsHeaders
                            });
                        }

                        const userId = crypto.randomUUID();
                        const userIdBytes = uuidToBytes(userId);
                        const options = await generateRegistrationOptions({
                            rpName,
                            rpID,
                            userID: userIdBytes,
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
                        ).bind(userId, username, options.challenge).run();

                        return new Response(JSON.stringify({
                            ...options,
                            user: {
                                id: userIdBytes,
                                name: username
                            }
                        }), { headers: corsHeaders });
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
                            headers: corsHeaders
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
                        const { registrationInfo } = verification;
                        console.log('Registration info:', registrationInfo);

                        // Store the credential public key as a base64url string
                        const credentialPublicKeyB64 = bytesToBase64url(registrationInfo.credential.publicKey);

                        // Save authenticator
                        await env.DB.prepare(
                            'INSERT INTO authenticators (user_id, credential_id, credential_public_key, counter) VALUES (?, ?, ?, ?)'
                        ).bind(
                            user.id,
                            registrationInfo.credential.id,
                            credentialPublicKeyB64,
                            registrationInfo.credential.counter
                        ).run();

                        // Clear challenge
                        await env.DB.prepare(
                            'UPDATE users SET current_challenge = NULL WHERE id = ?'
                        ).bind(user.id).run();

                        return new Response(JSON.stringify({ verified: true }), { headers: corsHeaders });
                    }

                    return new Response(JSON.stringify({ verified: false }), { headers: corsHeaders });
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
                        return new Response('Not found', { status: 404, headers: corsHeaders });
                    }

                    // Get authenticators
                    const authenticators = await env.DB.prepare(
                        'SELECT * FROM authenticators WHERE user_id = ?'
                    ).bind(user.id).all();

                    console.log('Found authenticators:', authenticators.results);

                    if (!authenticators.results.length) {
                        return new Response(JSON.stringify({ error: 'No authenticators registered' }), {
                            status: 400,
                            headers: corsHeaders
                        });
                    }

                    const options = await generateAuthenticationOptions({
                        rpID,
                        userVerification: 'preferred',
                        allowCredentials: authenticators.results.map(auth => ({
                            id: auth.credential_id,
                            type: 'public-key',
                            transports: ['internal', 'hybrid', 'usb', 'ble', 'nfc']
                        }))
                    });

                    console.log('Authentication options:', options);

                    // Store challenge
                    await env.DB.prepare(
                        'UPDATE users SET current_challenge = ? WHERE id = ?'
                    ).bind(options.challenge, user.id).run();

                    return new Response(JSON.stringify(options), { headers: corsHeaders });
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
                        return new Response('Not found', { status: 404, headers: corsHeaders });
                    }

                    if (!user.current_challenge) {
                        return new Response(JSON.stringify({ error: 'Invalid authentication session' }), {
                            status: 400,
                            headers: corsHeaders
                        });
                    }

                    // Get authenticators
                    const authenticators = await env.DB.prepare(
                        'SELECT * FROM authenticators WHERE user_id = ?'
                    ).bind(user.id).all();

                    console.log('Found authenticators:', authenticators.results);

                    if (!authenticators.results.length) {
                        return new Response(JSON.stringify({ error: 'No authenticators registered' }), {
                            status: 400,
                            headers: corsHeaders
                        });
                    }

                    try {
                        console.log('Full response structure:', JSON.stringify(body, null, 2));
                        console.log('Parsed authenticator data:', body.response.authenticatorData);

                        const verification = await verifyAuthenticationResponse({
                            response: body,
                            expectedChallenge: user.current_challenge,
                            expectedOrigin: origin,
                            expectedRPID: rpID,
                            requireUserVerification: true,
                            credential: {
                                id: authenticators.results[0].credential_id,
                                publicKey: base64urlToBytes(authenticators.results[0].credential_public_key),
                                counter: authenticators.results[0].counter,
                                transports: ['internal']
                            }
                        });

                        const { verified, authenticationInfo } = verification;
                        if (verified) {
                            // Update the authenticator's counter in the database
                            const { newCounter } = authenticationInfo;
                            await env.DB.prepare(
                                'UPDATE authenticators SET counter = ? WHERE credential_id = ?'
                            ).bind(newCounter, authenticators.results[0].credential_id).run();

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
                                    'Content-Type': 'application/json'
                                }
                            });
                        }

                        console.log('Authentication verification result:', verification);

                        if (verified) {
                            // Clear challenge
                            await env.DB.prepare(
                                'UPDATE users SET current_challenge = NULL WHERE id = ?'
                            ).bind(user.id).run();

                            return new Response(JSON.stringify({ verified: true }), { headers: corsHeaders });
                        }
                    } catch (error) {
                        console.error('Authentication error:', error);
                        return new Response(JSON.stringify({ 
                            error: error.message,
                            stack: error.stack
                        }), { 
                            status: 400,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json'
                            }
                        });
                    }

                    return new Response(JSON.stringify({ verified: false }), { headers: corsHeaders });
                }
            }

            return new Response('Not found', { status: 404, headers: corsHeaders });
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }
};

// Default export for Cloudflare
export default handler;
