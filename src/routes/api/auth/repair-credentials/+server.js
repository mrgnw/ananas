import { json } from '@sveltejs/kit';
import { getAllUsers } from '$lib/server/webauthn';
import { dev } from '$app/environment';

// Debug endpoint to repair credential data - only available in development
export async function POST({ request }) {
  if (!dev) {
    return new Response('This endpoint is only available in development', { status: 403 });
  }

  try {
    // This action will fix all credentials for all users
    const users = getAllUsers();
    let fixedCount = 0;
    let userCount = 0;
    
    users.forEach(user => {
      let userFixed = false;
      
      user.credentials.forEach(credential => {
        let credentialFixed = false;
        
        // Fix missing counter
        if (credential.counter === undefined || credential.counter === null) {
          credential.counter = 0;
          credentialFixed = true;
        }
        
        // Fix counter type
        if (typeof credential.counter !== 'number') {
          credential.counter = Number(credential.counter) || 0;
          credentialFixed = true;
        }
        
        if (credentialFixed) {
          fixedCount++;
          userFixed = true;
        }
      });
      
      if (userFixed) {
        userCount++;
      }
    });
    
    return json({
      success: true,
      message: `Fixed ${fixedCount} credentials across ${userCount} users`
    });
  } catch (error) {
    console.error('Error repairing credentials:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
