import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { users } from '$lib/server/schema/users.js';
import { eq } from 'drizzle-orm';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip);
  // Remove old requests outside the window
  const validRequests = requests.filter(time => time > windowStart);
  rateLimitMap.set(ip, validRequests);
  
  if (validRequests.length >= MAX_REQUESTS) {
    return true;
  }
  
  validRequests.push(now);
  return false;
}

export async function POST({ request, getClientAddress }) {
  try {
    const clientIP = getClientAddress();
    
    // Rate limiting
    if (isRateLimited(clientIP)) {
      return json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const { email } = await request.json();
    
    if (!email || typeof email !== 'string') {
      return json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Check if user exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    // Always return same response time to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
    
    return json({
      exists: existingUser.length > 0
    });
    
  } catch (error) {
    console.error('Email check error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}