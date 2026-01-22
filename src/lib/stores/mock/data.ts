export interface User {
    id: string;
    name: string;
    avatarUrl: string;
    email: string;
}

export interface UserPreferences {
    userId: string;
    focusModes: string[]; // 'post' | 'support' | 'collab' | 'event'
}

export type ProjectStatus = 'draft' | 'published' | 'archived';

export interface Project {
    id: string;
    ownerId: string;
    title: string;
    summary: string;
    description: string;
    publicUrl?: string;
    repoUrl?: string;
    demoUrl?: string;
    tags: string[];
    status: ProjectStatus;
    images: string[];
    updatedAt: string;
}

export type PostType = 'progress' | 'question' | 'showcase';

export interface TimelinePost {
    id: string;
    authorId: string;
    type: PostType;
    title?: string; // For showcase/question
    body: string;
    projectId?: string;
    eventId?: string;
    questionMeta?: {
        situation: string;
        problem: string;
        tried: string;
        environment: string;
    };
    status?: 'open' | 'solved';
    acceptedCommentId?: string;
    createdAt: string;
}

export interface Comment {
    id: string;
    targetId: string;
    targetType: 'project' | 'post' | 'comment';
    authorId: string;
    body: string;
    createdAt: string;
}

export interface Reaction {
    id: string;
    targetId: string;
    targetType: 'project' | 'post' | 'comment';
    userId: string;
    kind: 'clap' | 'like' | 'idea' | 'fire' | 'help';
}

export interface SupportRecord {
    id: string;
    projectId: string;
    supporterId: string;
    amount: number;
    message?: string;
    status: 'awaiting_owner' | 'confirmed' | 'cancelled' | 'rejected';
    createdAt: string;
}

export interface Conversation {
    id: string;
    type: 'direct' | 'project';
    projectId?: string;
    memberIds: string[];
    lastMessageAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    createdAt: string;
}

// --- Initial Data ---

export const CURRENT_USER_ID = 'u1';

export const USERS: User[] = [
    { id: 'u1', name: 'YutaDEV', avatarUrl: 'https://i.pravatar.cc/150?u=u1', email: 'yuta@example.com' },
    { id: 'u2', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?u=u2', email: 'alice@example.com' },
    { id: 'u3', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?u=u3', email: 'bob@example.com' },
];

export const PROJECTS: Project[] = [
    {
        id: 'p1',
        ownerId: 'u1',
        title: 'Growth Hach Platform',
        summary: 'ハッカソン作品の継続開発を支援するプラットフォーム',
        description: '詳細な説明...',
        tags: ['SvelteKit', 'TypeScript'],
        status: 'published',
        images: ['https://placehold.co/600x400?text=Project+Image'],
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'p2',
        ownerId: 'u2',
        title: 'AI Code Assistant',
        summary: 'VSCode extension for AI coding',
        description: 'AIがコードを書いてくれる',
        tags: ['AI', 'VSCode'],
        status: 'published',
        images: [],
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    }
];

export const TIMELINE_POSTS: TimelinePost[] = [
    {
        id: 'tp1',
        authorId: 'u1',
        type: 'progress',
        body: 'モックアップ作成中。SvelteKitのストアが便利すぎる。',
        projectId: 'p1',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'tp2',
        authorId: 'u2',
        type: 'question',
        title: 'デプロイエラーについて',
        body: 'Vercelへのデプロイが失敗します。',
        questionMeta: {
            situation: 'mainブランチにプッシュした',
            problem: 'Build fail',
            tried: 'ログ確認',
            environment: 'Node 18',
        },
        status: 'open',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
    }
];

export const COMMENTS: Comment[] = [];
export const REACTIONS: Reaction[] = [];
export const SUPPORT_RECORDS: SupportRecord[] = [];
export const CONVERSATIONS: Conversation[] = [];
export const MESSAGES: Message[] = [];
export const USER_PREFERENCES: UserPreferences[] = [
    { userId: 'u1', focusModes: ['post', 'collab'] }
];

// --- Additional Mock Data for Dashboard Testing ---

// Ensure there is an unresolved question for the current user
TIMELINE_POSTS.push({
    id: 'tp_my_question',
    authorId: CURRENT_USER_ID,
    type: 'question',
    title: 'SvelteKitのSSRでエラーが出る',
    body: '特定のリクエストだけで500エラーになります。ログの出し方がわかりません。',
    questionMeta: {
        situation: 'Production環境',
        problem: '500 Error',
        tried: 'Vercel Logs',
        environment: 'Vercel / SvelteKit 2.0'
    },
    status: 'open',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
});

// Ensure there is a conversation with unread messages
CONVERSATIONS.push({
    id: 'c1',
    type: 'project',
    projectId: 'p2',
    memberIds: [CURRENT_USER_ID, 'u2'],
    lastMessageAt: new Date().toISOString()
});

MESSAGES.push({
    id: 'm1',
    conversationId: 'c1',
    senderId: 'u2',
    body: 'プロジェクトに参加したいです！詳しく話を聞かせてもらえませんか？',
    createdAt: new Date(Date.now() - 1800000).toISOString()
});
