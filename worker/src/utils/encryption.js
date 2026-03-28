import crypto from 'node:crypto';
import env from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';

const getKey = () => {
  if (!env.encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not configured');
  }

  return crypto.createHash('sha256').update(String(env.encryptionKey)).digest();
};

export const decrypt = (text) => {
  const [ivHex, authTagHex, encryptedHex] = String(text || '').split(':');

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
