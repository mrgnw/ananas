import type { User, Authenticator } from './user';

const users: { [key: string]: User } = {};

export function getUser(userId: string): User | null {
  return users[userId] || null;
}

export function saveUser(user: User): void {
  users[user.id] = user;
}

export function saveAuthenticator(user: User, authenticator: Authenticator): void {
  const existingUser = getUser(user.id);
  if (existingUser) {
    existingUser.authenticators.push(authenticator);
    saveUser(existingUser);
  }
}

export function getAuthenticator(user: User, credentialID: string): Authenticator | null {
  return user.authenticators.find(auth => auth.credentialID === credentialID) || null;
}