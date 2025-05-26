import crypto from 'node:crypto'
import 'dotenv/config'

const ALGORITHM = 'aes-256-gcm'
const SECRET_KEY = Buffer.from(process.env.COOKIE_SECRET, 'base64')
const IV_LENGTH = 12

interface EncryptedData {
  iv: string
  data: string
  tag: string
}

export function encryptCookie(value: string): string {
  const iv = crypto.randomBytes(IV_LENGTH) // Generate a random IV
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv)

  let encrypted = cipher.update(value, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  const encryptedData: EncryptedData = {
    iv: iv.toString('base64'),
    data: encrypted,
    tag: authTag.toString('base64'),
  }

  return JSON.stringify(encryptedData)
}

export function decryptCookie(encryptedValue: string): string {
  const { iv, data, tag } = JSON.parse(encryptedValue) as EncryptedData

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))

  let decrypted = decipher.update(data, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
