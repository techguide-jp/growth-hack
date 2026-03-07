import { and, desc, eq } from "drizzle-orm";
import { getDb } from "$lib/server/db";
import {
  conversationMembers,
  conversations,
  messageReads,
  messages,
} from "$lib/server/db/schema";

export async function getConversationById(conversationId: string) {
  const db = getDb();
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  return conversation ?? null;
}

export async function listConversationMembers(conversationId: string) {
  const db = getDb();

  return db
    .select()
    .from(conversationMembers)
    .where(eq(conversationMembers.conversationId, conversationId));
}

export async function isConversationMember(
  conversationId: string,
  userId: string,
) {
  const db = getDb();
  const [member] = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .limit(1);

  return Boolean(member);
}

export async function listUserConversations(userId: string) {
  const db = getDb();

  return db
    .select({
      conversation: conversations,
      readState: messageReads,
    })
    .from(conversationMembers)
    .innerJoin(
      conversations,
      eq(conversationMembers.conversationId, conversations.id),
    )
    .leftJoin(
      messageReads,
      and(
        eq(messageReads.conversationId, conversations.id),
        eq(messageReads.userId, userId),
      ),
    )
    .where(eq(conversationMembers.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function listMessagesForConversation(conversationId: string) {
  const db = getDb();

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}
