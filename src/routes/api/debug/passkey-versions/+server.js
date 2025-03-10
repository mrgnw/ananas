import { json } from '@sveltejs/kit';
import * as server from '@simplewebauthn/server';
import { execSync } from 'child_process';

export async function GET() {
  let bunVersion = 'Not available';
  
  try {
    bunVersion = execSync('bun -v').toString().trim();
  } catch (err) {
    console.error('Failed to get Bun version:', err);
  }
  
  return json({
    serverVersion: server.serverVersion || 'Unknown',
    nodeVersion: process.version,
    bunVersion
  });
}
