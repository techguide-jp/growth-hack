import { writable, type Writable, get, derived } from 'svelte/store';
import * as D from './data';

// --- Stores ---

export const currentUser = writable<D.User | null>(D.USERS.find(u => u.id === D.CURRENT_USER_ID) || null);
export const users = writable<D.User[]>(D.USERS);
export const projects = writable<D.Project[]>(D.PROJECTS);
export const timelinePosts = writable<D.TimelinePost[]>(D.TIMELINE_POSTS);
export const comments = writable<D.Comment[]>(D.COMMENTS);
export const reactions = writable<D.Reaction[]>(D.REACTIONS);
export const supportRecords = writable<D.SupportRecord[]>(D.SUPPORT_RECORDS);
export const conversations = writable<D.Conversation[]>(D.CONVERSATIONS);
export const messages = writable<D.Message[]>(D.MESSAGES);
export const userPreferences = writable<D.UserPreferences[]>(D.USER_PREFERENCES);

// --- Helpers ---

export const getProject = (id: string) => derived(projects, $p => $p.find(p => p.id === id));
export const getUser = (id: string) => derived(users, $u => $u.find(u => u.id === id));

// --- Actions (Mock API) ---

export const api = {
    // Timeline
    addPost: (post: Omit<D.TimelinePost, 'id' | 'createdAt'>) => {
        const newPost: D.TimelinePost = {
            ...post,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        timelinePosts.update(posts => [newPost, ...posts]);
    },

    solveQuestion: (postId: string, commentId: string) => {
        timelinePosts.update(posts => posts.map(p =>
            p.id === postId ? { ...p, status: 'solved', acceptedCommentId: commentId } : p
        ));
    },

    // Comments
    addComment: (comment: Omit<D.Comment, 'id' | 'createdAt'>) => {
        const newComment: D.Comment = {
            ...comment,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        comments.update(c => [...c, newComment]);
    },

    // Reactions
    toggleReaction: (targetId: string, targetType: D.Reaction['targetType'], kind: D.Reaction['kind'], userId: string) => {
        reactions.update(current => {
            const existing = current.find(r => r.targetId === targetId && r.targetType === targetType && r.userId === userId && r.kind === kind);
            if (existing) {
                return current.filter(r => r !== existing); // Remove
            } else {
                return [...current, { id: crypto.randomUUID(), targetId, targetType, userId, kind }]; // Add
            }
        });
    },

    // Projects
    createProject: (project: Omit<D.Project, 'id' | 'updatedAt' | 'images'>) => {
        const newProject: D.Project = {
            ...project,
            id: crypto.randomUUID(),
            updatedAt: new Date().toISOString(),
            images: []
        };
        projects.update(p => [newProject, ...p]);
        return newProject.id;
    },

    updateProject: (id: string, updates: Partial<D.Project>) => {
        projects.update(p => p.map(proj => proj.id === id ? { ...proj, ...updates, updatedAt: new Date().toISOString() } : proj));
    },

    // Support
    createSupportRecord: (record: Omit<D.SupportRecord, 'id' | 'createdAt' | 'status'>) => {
        const newRecord: D.SupportRecord = {
            ...record,
            id: crypto.randomUUID(),
            status: 'awaiting_owner',
            createdAt: new Date().toISOString(),
        };
        supportRecords.update(r => [...r, newRecord]);
    },

    confirmSupportRecord: (id: string) => {
        supportRecords.update(r => r.map(rec => rec.id === id ? { ...rec, status: 'confirmed' } : rec));
    },

    // Messages
    sendMessage: (conversationId: string, senderId: string, body: string) => {
        const msg: D.Message = {
            id: crypto.randomUUID(),
            conversationId,
            senderId,
            body,
            createdAt: new Date().toISOString()
        };
        messages.update(m => [...m, msg]);
        conversations.update(c => c.map(conv => conv.id === conversationId ? { ...conv, lastMessageAt: msg.createdAt } : conv));
    },

    // User Prefs
    updateFocusModes: (userId: string, modes: string[]) => {
        userPreferences.update(prefs => {
            const existing = prefs.find(p => p.userId === userId);
            if (existing) {
                return prefs.map(p => p.userId === userId ? { ...p, focusModes: modes } : p);
            } else {
                return [...prefs, { userId, focusModes: modes }];
            }
        });
    }
};
