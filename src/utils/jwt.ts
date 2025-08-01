/*
 * IMPORTS
 */
import jwt from "jsonwebtoken";

/*
 * JWT
 */
const JWT_SECRET = process.env.JWT_SECRET!;



/*
 * EXPORTS
 */
export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }); // token valid 7 days
}

/*
 * EXPORTS
 */
export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
