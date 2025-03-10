import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Only available in development mode for security reasons
export async function POST(event) {
  if (!dev) {
    return new Response('Not available in production', { status: 403 });
  }
  
  try {
    const { request } = event;
    const body = await request.json();
    
    // Deep inspect the authentication credential and response
    console.log('--- AUTHENTICATION DEBUG INFO ---');
    
    // Check top-level properties
    console.log('Top level properties:', Object.keys(body));
    
    // Check if body looks like a valid WebAuthn credential
    if (body.id && body.rawId && body.response && body.type) {
      console.log('Structure appears to be a valid WebAuthn credential');
      
      // Check response properties
      console.log('Response properties:', Object.keys(body.response));
      
      // Check for required authentication response properties
      const hasClientData = !!body.response.clientDataJSON;
      const hasAuthData = !!body.response.authenticatorData;
      const hasSignature = !!body.response.signature;
      
      console.log('Required properties present:', {
        clientDataJSON: hasClientData,
        authenticatorData: hasAuthData,
        signature: hasSignature
      });
      
      // Detect if this is from SimpleWebAuthn browser package
      const isFromSimpleWebAuthn = body.response.clientDataJSON && 
                                   typeof body.response.clientDataJSON === 'string';
      
      console.log('Likely from SimpleWebAuthn browser:', isFromSimpleWebAuthn);
      
      return json({
        valid: hasClientData && hasAuthData && hasSignature,
        isFromSimpleWebAuthn,
        structure: {
          id: typeof body.id,
          hasRawId: !!body.rawId,
          hasResponse: !!body.response,
          type: body.type
        },
        responseProperties: {
          hasClientDataJSON: hasClientData,
          hasAuthenticatorData: hasAuthData,
          hasSignature: hasSignature,
          clientDataJSONLength: body.response.clientDataJSON?.length,
          authenticatorDataLength: body.response.authenticatorData?.length,
          signatureLength: body.response.signature?.length
        }
      });
    } else {
      console.log('Structure does not appear to be a valid WebAuthn credential');
      return json({
        valid: false,
        structure: {
          hasId: !!body.id,
          hasRawId: !!body.rawId,
          hasResponse: !!body.response,
          type: body.type
        }
      });
    }
  } catch (error) {
    console.error('Error in debug-authentication:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
