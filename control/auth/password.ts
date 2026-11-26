import 'server-only'
import bcrypt from 'bcryptjs'

// Same algorithm the credentials provider verifies against at login.
export function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}
