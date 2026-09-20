import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "tokoin_pos_secret_key_2026_umkm_secure"
);

const TOKEN_NAME = "tokoin_session";

export interface UserSession {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: "ADMIN" | "CASHIER";
}

// 1. Sign JWT Token
export async function createSessionToken(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

// 2. Verify JWT Token
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

// 3. Set Session Cookie
export async function setSessionCookie(user: UserSession) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

// 4. Clear Session Cookie (Logout)
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

// 5. Get Current User from Session
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

// 6. Login Function with validation
export async function loginAction(formData: FormData): Promise<{
  success: boolean;
  message?: string;
  user?: UserSession;
  redirectUrl?: string;
}> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, message: "Username dan kata sandi wajib diisi." };
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username.trim() },
        { email: username.trim().toLowerCase() },
      ],
    },
  });

  if (!user) {
    return { success: false, message: "Username atau kata sandi salah." };
  }

  if (user.status !== "ACTIVE") {
    return {
      success: false,
      message: "Akun Anda dinonaktifkan. Silakan hubungi pemilik toko.",
    };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return { success: false, message: "Username atau kata sandi salah." };
  }

  const sessionData: UserSession = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role as "ADMIN" | "CASHIER",
  };

  await setSessionCookie(sessionData);

  const redirectUrl =
    user.role === "ADMIN" ? "/admin/dashboard" : "/pos";

  return {
    success: true,
    message: "Login berhasil.",
    user: sessionData,
    redirectUrl,
  };
}
