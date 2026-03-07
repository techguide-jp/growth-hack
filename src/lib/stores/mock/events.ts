export type EventRoomPostType = "progress" | "question" | "showcase";

export interface EventRoomPost {
  id: string;
  authorName: string;
  type: EventRoomPostType;
  body: string;
  createdAt: string;
}

export interface MockEvent {
  id: string;
  shortTitle: string;
  title: string;
  summary: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  status: "draft" | "published" | "ended";
  visualClass: string;
  tags: string[];
  roomPosts: EventRoomPost[];
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: "tech-week-2026",
    shortTitle: "Tech Week 2026",
    title: "Tech Week Hackathon 2026",
    summary: "7日間でMVPを磨き込み、継続開発に繋げるオンラインハッカソン。",
    description:
      "アイデア段階からMVP公開までを1週間で走り切るイベントです。開催期間中はイベントルームで進捗共有・相談投稿を推奨します。",
    startAt: "2026-03-02T10:00:00+09:00",
    endAt: "2026-03-08T19:00:00+09:00",
    location: "Online",
    status: "published",
    visualClass: "from-blue-500 to-cyan-500",
    tags: ["Web", "AI", "個人開発"],
    roomPosts: [
      {
        id: "ep1",
        authorName: "YutaDEV",
        type: "progress",
        body: "初日でログインと投稿導線を実装。明日は相談テンプレを固めます。",
        createdAt: "2026-03-02T20:10:00+09:00",
      },
      {
        id: "ep2",
        authorName: "Alice",
        type: "question",
        body: "SvelteKitのフォームバリデーションをどこまで共通化するか悩んでいます。",
        createdAt: "2026-03-03T11:30:00+09:00",
      },
      {
        id: "ep3",
        authorName: "Bob",
        type: "showcase",
        body: "プロジェクト詳細ページのタブUIを一気に刷新しました。",
        createdAt: "2026-03-03T16:45:00+09:00",
      },
    ],
  },
  {
    id: "weekend-game-jam-2026",
    shortTitle: "Weekend Dev",
    title: "Weekend Game Jam 2026",
    summary: "週末2日でゲームプロトタイプを作って公開する短期集中イベント。",
    description:
      "短期間で作って出すことを重視したゲームジャム。終了後は本サービス上で継続アップデートを共有します。",
    startAt: "2026-04-11T09:00:00+09:00",
    endAt: "2026-04-12T21:00:00+09:00",
    location: "Tokyo + Online",
    status: "published",
    visualClass: "from-pink-500 to-orange-500",
    tags: ["Game", "Creative", "Weekend"],
    roomPosts: [
      {
        id: "ep4",
        authorName: "Mika",
        type: "progress",
        body: "プレイヤーの操作感を調整中。夜までにステージ1を完成予定。",
        createdAt: "2026-04-11T13:00:00+09:00",
      },
      {
        id: "ep5",
        authorName: "Kento",
        type: "showcase",
        body: "敵AIの行動パターンが完成。かなり手応えが出てきました。",
        createdAt: "2026-04-11T18:20:00+09:00",
      },
    ],
  },
];
