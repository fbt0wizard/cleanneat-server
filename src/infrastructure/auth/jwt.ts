import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
}

const DEFAULT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function generateToken(
  payload: JwtPayload,
  secret: string,
  expiresInSeconds: number = DEFAULT_EXPIRES_IN_SECONDS,
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds });
}

export function verifyToken(token: string, secret: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw error;
  }
}
