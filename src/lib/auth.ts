import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getDb } from "$lib/server/db";
import * as schema from "$lib/server/db/schema";
import {
  parseAdminEmails,
  provisionUserSettings,
} from "$lib/server/account-settings";

const authBaseUrl = env.BETTER_AUTH_URL?.trim() || undefined;
const authSecret =
  env.BETTER_AUTH_SECRET || "development-only-secret-development-only-secret";
const adminEmails = parseAdminEmails(env.ADMIN_EMAILS);

function getRequestOrigin(request: Request | undefined) {
  if (!request) {
    return null;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export const auth = betterAuth({
  secret: authSecret,
  baseURL: authBaseUrl,
  basePath: "/api/auth",
  advanced: {
    trustedProxyHeaders: true,
  },
  trustedOrigins: (request) => {
    const requestOrigin = getRequestOrigin(request);

    if (!requestOrigin || requestOrigin === authBaseUrl) {
      return [];
    }

    return [requestOrigin];
  },
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || "missing-google-client-id",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "missing-google-client-secret",
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID || "missing-github-client-id",
      clientSecret: env.GITHUB_CLIENT_SECRET || "missing-github-client-secret",
    },
  },
  user: {
    modelName: "users",
    fields: {
      name: "displayName",
      image: "avatarUrl",
      emailVerified: "emailVerified",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: false,
        defaultValue: "user",
        fieldName: "role",
      },
    },
  },
  session: {
    modelName: "sessions",
    fields: {
      userId: "userId",
      expiresAt: "expiresAt",
      ipAddress: "ipAddress",
      userAgent: "userAgent",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      accountId: "accountId",
      providerId: "providerId",
      userId: "userId",
      accessToken: "accessToken",
      refreshToken: "refreshToken",
      idToken: "idToken",
      accessTokenExpiresAt: "accessTokenExpiresAt",
      refreshTokenExpiresAt: "refreshTokenExpiresAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
      allowDifferentEmails: false,
    },
  },
  verification: {
    modelName: "verifications",
    fields: {
      expiresAt: "expiresAt",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
  disabledPaths: ["/sign-in/email", "/sign-up/email"],
  telemetry: {
    enabled: false,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const normalizedEmail = user.email.toLowerCase();

          return {
            data: {
              ...user,
              email: normalizedEmail,
              role: adminEmails.has(normalizedEmail) ? "admin" : "user",
            },
          };
        },
        after: async (user) => {
          await provisionUserSettings(user.id);
        },
      },
      update: {
        before: async (user) => {
          if (!user.email) {
            return;
          }

          return {
            data: {
              ...user,
              email: user.email.toLowerCase(),
            },
          };
        },
      },
    },
  },
  plugins: [sveltekitCookies(getRequestEvent)],
});

export type AuthSession = typeof auth.$Infer.Session;
