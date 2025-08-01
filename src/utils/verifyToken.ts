/*
 * IMPORTS
 */
import jwt from 'jsonwebtoken';


/*
 * EXPORTS
 */
export interface DecodedUser {
  userId: string;
  role: string;
  // jo bhi aur fields tum token me sign karoge
}


/*
 * EXPORTS
 */
export function verifyToken(authHeader?: string): DecodedUser | null {
  if (!authHeader) return null;

  // Example: "Bearer <token>"
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedUser;
      return decoded;
    } catch (err) {
      console.warn('Invalid token:', err);
      return null;
    }
  }

  return null;
}
