import { DecodedIdToken } from 'firebase-admin/auth';
import admin from './firebase-admin';
import { NextRequest } from 'next/server';

async function verifyIdToken(authorizationHeader: string | null): Promise<DecodedIdToken> {
  if (!authorizationHeader) {
    throw new Error('Authorization header is required');
  }

  if (!authorizationHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header must start with "Bearer "');
  }

  const idToken = authorizationHeader.substring(7); // Remove "Bearer " prefix

  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid or expired token');
  }
}

export async function validateAuth(request: NextRequest) {
  const authorizationHeader = request.headers.get('authorization');
  return await verifyIdToken(authorizationHeader);
}