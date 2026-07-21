// Core TypeScript types for AI Tutor SD

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  images?: ImageAttachment[];
  audioUrl?: string;
  audioTranscript?: string;
  isStreaming?: boolean;
  isError?: boolean;
  streamStartTime?: number;   // timestamp when streaming started
  streamDuration?: number;    // total seconds when streaming finished
}

export interface ImageAttachment {
  id: string;
  url: string;
  name: string;
  type: string;
  base64: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  sidebarOpen: boolean;
}

export interface APIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | APIMessageContent[];
}

export type APIMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

export interface SubjectCard {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  examples: string[];
}

export type Theme = 'light' | 'dark';
