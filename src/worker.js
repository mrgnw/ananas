import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

const rpName = 'Ananas';
const rpID = 'localhost';
const origin = 'http://localhost:5173';

// Convert UUID string to Uint8Array
function uuidToBytes(uuid) {
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
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

export default {
    async fetch(request, env) {
        try {
            const url = new URL(request.url);
            const method = request.method;

            // Add CORS headers
            const headers = {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            };

            // Handle CORS preflight
            if (method === 'OPTIONS') {
                return new Response(null, { headers });
            }

            if (url.pathname === '/auth/register') {
                if (method === 'POST') {
                    const body = await request.json();
                    const username = body.username;

                    console.log('Registering user:', username);

                    // Check if user exists
                    const existingUser = await env.DB.prepare(
                        'SELECT * FROM users WHERE username = ?'
                    ).bind(username).first();

                    if (existingUser) {
                        return new Response(JSON.stringify({ error: 'Username already exists' }), {
                            status: 400,
                            headers
                        });
                    }

                    const userId = crypto.randomUUID();
                    const options = await generateRegistrationOptions({
                        rpName,
                        rpID,
                        userID: uuidToBytes(userId),
                        userName: username,
                        attestationType: 'none',
                        authenticatorSelection: {
                            residentKey: 'required',
                            userVerification: 'preferred'
                        }
                    });

                    console.log('Registration options:', options);

                    // Create user with challenge
                    await env.DB.prepare(
                        'INSERT INTO users (id, username, current_challenge) VALUES (?, ?, ?)'
                    ).bind(userId, username, options.challenge).run();

                    return new Response(JSON.stringify(options), { headers });
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
                            headers
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

                        return new Response(JSON.stringify({ verified: true }), { headers });
                    }

                    return new Response(JSON.stringify({ verified: false }), { headers });
                }
            } else if (url.pathname === '/auth/authenticate') {
                if (method === 'POST') {
                    const body = await request.json();
                    const { username } = body;

                    console.log('Authenticating user:', username);

                    // Get user
                    const user = await env.DB.prepare(
                        'SELECT * FROM users WHERE username = ?'
                    ).bind(username).first();

                    if (!user) {
                        return new Response(JSON.stringify({ error: 'User not found' }), {
                            status: 400,
                            headers
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
                            headers
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

                    return new Response(JSON.stringify(options), { headers });
                } else if (method === 'PUT') {
                    const body = await request.json();
                    const { username } = body;

                    console.log('Authentication body:', body);
                    console.log('Verifying authentication for user:', username);

                    // Get user and challenge
                    const user = await env.DB.prepare(
                        'SELECT * FROM users WHERE username = ?'
                    ).bind(username).first();

                    if (!user || !user.current_challenge) {
                        return new Response(JSON.stringify({ error: 'Invalid authentication session' }), {
                            status: 400,
                            headers
                        });
                    }

                    // Get authenticator
                    const authenticator = await env.DB.prepare(
                        'SELECT * FROM authenticators WHERE user_id = ?'
                    ).bind(user.id).first();

                    console.log('Found authenticator:', authenticator);

                    if (!authenticator) {
                        return new Response(JSON.stringify({ error: 'Authenticator not found' }), {
                            status: 400,
                            headers
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
                                id: authenticator.credential_id,
                                publicKey: base64urlToBytes(authenticator.credential_public_key),
                                counter: authenticator.counter,
                                transports: ['internal']
                            }
                        });

                        const { verified, authenticationInfo } = verification;
                        if (verified) {
                            // Update the authenticator's counter in the database
                            const { newCounter } = authenticationInfo;
                            await env.DB.prepare(
                                'UPDATE authenticators SET counter = ? WHERE credential_id = ?'
                            ).bind(newCounter, authenticator.credential_id).run();
                        }

                        console.log('Authentication verification result:', verification);

                        if (verified) {
                            // Clear challenge
                            await env.DB.prepare(
                                'UPDATE users SET current_challenge = NULL WHERE id = ?'
                            ).bind(user.id).run();

                            return new Response(JSON.stringify({ verified: true }), { headers });
                        }
                    } catch (error) {
                        console.error('Authentication error:', error);
                        return new Response(JSON.stringify({ error: error.message }), {
                            status: 400,
                            headers
                        });
                    }

                    return new Response(JSON.stringify({ verified: false }), { headers });
                }
            }

            return new Response('Not found', { status: 404, headers });
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': origin
                }
            });
        }
    }
};
