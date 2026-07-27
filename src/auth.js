/**
 * Custom auth helpers — stores users in a `users` table.
 * No Supabase Auth / no email confirmation needed.
 * Password is stored as a simple hash (SHA-256 via SubtleCrypto).
 *
 * Roles: farmer | owner | admin | transport
 * Owner accounts start with status='pending' until an admin approves them.
 */
import { supabase } from './supabase';

/**
 * ADMIN ALLOWLIST — only these 5 mobile numbers / email addresses
 * can log in or register as admin. Add mobile as plain digits (no spaces/+91)
 * or email in lowercase.
 *
 * To update: replace the placeholder values below with real ones.
 */
const ADMIN_ALLOWLIST = [
  '7338818060',
  '9344531196',
  '7339417356',
  '8754489795',
  '8754156911',
  '8939857258',
];

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Register a new user. Returns { user, error, alreadyExists } */
export async function registerUser({ firstName, lastName, mobile, email, password, stateDistrict, role }) {
  const cleanMobile = mobile.replace(/\s/g, '');
  const cleanEmail  = email?.trim().toLowerCase() || null;

  // Admin allowlist check — only listed identifiers can register as admin
  if (role === 'admin') {
    const mobileAllowed = ADMIN_ALLOWLIST.includes(cleanMobile);
    const emailAllowed  = cleanEmail && ADMIN_ALLOWLIST.includes(cleanEmail);
    if (ADMIN_ALLOWLIST.length > 0 && !mobileAllowed && !emailAllowed) {
      return {
        user: null,
        error: { message: '🚫 Access denied. This mobile/email is not authorised to register as admin.' },
      };
    }
  }

  // Check if mobile already exists
  const { data: existingMobile } = await supabase
    .from('users').select('id, role').eq('mobile', cleanMobile).single();
  if (existingMobile) return { user: existingMobile, error: null, alreadyExists: true };

  // Check if email already exists (if provided)
  if (cleanEmail) {
    const { data: existingEmail } = await supabase
      .from('users').select('id, role').eq('email', cleanEmail).single();
    if (existingEmail) return { user: null, error: { message: 'This email is already registered. Please login.' } };
  }

  const passwordHash = await hashPassword(password);

  // Owners start as 'pending' until admin approves; everyone else is 'active'
  const status = role === 'owner' ? 'pending' : 'active';

  const { data, error } = await supabase.from('users').insert([{
    first_name:     firstName,
    last_name:      lastName,
    mobile:         cleanMobile,
    email:          cleanEmail,
    password_hash:  passwordHash,
    state_district: stateDistrict,
    role,
    status,
  }]).select().single();

  return { user: data, error };
}

/** Login with mobile OR email. Returns { user, error } */
export async function loginUser({ identifier, password, role }) {
  const clean        = identifier.replace(/\s/g, '');
  const isEmail      = clean.includes('@');
  const passwordHash = await hashPassword(password);

  // Admin allowlist check — block anyone not on the list
  if (role === 'admin') {
    const normalized = isEmail ? clean.toLowerCase() : clean;
    if (ADMIN_ALLOWLIST.length > 0 && !ADMIN_ALLOWLIST.includes(normalized)) {
      return {
        user: null,
        error: { message: '🚫 Access denied. You are not authorised to access the admin panel.' },
      };
    }
  }

  // Step 1 — fetch user by identifier only (not password), so RLS on password_hash doesn't interfere
  const { data: user } = isEmail
    ? await supabase.from('users').select('*').eq('email', clean.toLowerCase()).single()
    : await supabase.from('users').select('*').eq('mobile', clean).single();

  if (!user) {
    return { user: null, error: { message: 'Incorrect mobile/email or password.' } };
  }

  // Step 2 — verify password in JS (avoids any RLS column restriction on password_hash)
  if (user.password_hash !== passwordHash) {
    return { user: null, error: { message: 'Incorrect mobile/email or password.' } };
  }

  if (user.role !== role) {
    return { user: null, error: { message: `You are not registered as a ${role}.` } };
  }

  // Block pending owners from logging in
  if (role === 'owner' && user.status === 'pending') {
    return {
      user: null,
      error: {
        message: '⏳ Your account is pending admin approval. You will be notified once verified.',
        code: 'PENDING_APPROVAL',
      },
    };
  }

  // Block rejected owners
  if (role === 'owner' && user.status === 'rejected') {
    return {
      user: null,
      error: {
        message: '❌ Your registration was rejected by the admin. Please contact support.',
        code: 'REJECTED',
      },
    };
  }

  localStorage.setItem('agristore_user', JSON.stringify(user));
  return { user, error: null };
}

/** Get current logged-in user */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('agristore_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Logout */
export function logoutUser() {
  localStorage.removeItem('agristore_user');
}
