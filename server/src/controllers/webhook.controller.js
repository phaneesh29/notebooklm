import { Webhook } from 'svix';
import httpStatus from 'http-status';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

export const clerkWebhookHandler = async (req, res) => {
  const WEBHOOK_SECRET = env.clerkWebhookSecret;

  if (!WEBHOOK_SECRET) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Missing CLERK_WEBHOOK_SECRET in .env');
  }

  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Error occurred -- no svix headers');
  }

  const payload = req.body;
  const body = payload.toString('utf8');

  let wh;
  try {
    wh = new Webhook(WEBHOOK_SECRET.trim());
  } catch (err) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Webhook secret error: ${err.message}`);
  }

  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Error verifying webhook: ${err.message}`);
  }

  const { id } = evt.data;
  const eventType = evt.type;

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { email_addresses, username } = evt.data;
      const primaryEmail = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : '';

      await db.insert(users).values({
        clerkId: id,
        email: primaryEmail,
        username: username || '',
      }).onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: primaryEmail,
          username: username || ''
        }
      });
    } else if (eventType === 'user.deleted') {
      await db.delete(users).where(eq(users.clerkId, id));
    }
  } catch (dbError) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Database sync error');
  }

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, {}, 'Webhook processed'));
};
