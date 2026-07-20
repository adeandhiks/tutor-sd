'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message, ImageAttachment } from '@/lib/types';
import { storage } from '@/lib/storage';
import { streamChat } from '@/lib/api';
import { generateId, generateChatTitle } from '@/lib/utils';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  isGenerating: boolean;
  sidebarOpen: boolean;
  searchQuery: string;
  // Actions
  createNewChat: () => void;
  setActiveConversation: (id: string) => void;
  sendMessage: (content: string, images?: ImageAttachment[], audioTranscript?: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  stopGenerating: () => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  filteredConversations: Conversation[];
}

type ChatAction =
  | { type: 'SET_CONVERSATIONS'; conversations: Conversation[] }
  | { type: 'ADD_CONVERSATION'; conversation: Conversation }
  | { type: 'UPDATE_CONVERSATION'; id: string; updates: Partial<Conversation> }
  | { type: 'DELETE_CONVERSATION'; id: string }
  | { type: 'SET_ACTIVE'; id: string | null }
  | { type: 'SET_GENERATING'; isGenerating: boolean }
  | { type: 'SET_SIDEBAR'; open: boolean }
  | { type: 'ADD_MESSAGE'; conversationId: string; message: Message }
  | { type: 'UPDATE_MESSAGE'; conversationId: string; messageId: string; updates: Partial<Message> }
  | { type: 'REMOVE_LAST_MESSAGE'; conversationId: string };

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  sidebarOpen: boolean;
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.conversations };
    case 'ADD_CONVERSATION':
      return { ...state, conversations: [action.conversation, ...state.conversations] };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.id ? { ...c, ...action.updates } : c
        ),
      };
    case 'DELETE_CONVERSATION': {
      const newConversations = state.conversations.filter(c => c.id !== action.id);
      const newActiveId = state.activeConversationId === action.id
        ? (newConversations[0]?.id || null)
        : state.activeConversationId;
      return { ...state, conversations: newConversations, activeConversationId: newActiveId };
    }
    case 'SET_ACTIVE':
      return { ...state, activeConversationId: action.id };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.isGenerating };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.open };
    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.conversationId
            ? { ...c, messages: [...c.messages, action.message], updatedAt: Date.now() }
            : c
        ),
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.conversationId
            ? {
                ...c,
                messages: c.messages.map(m =>
                  m.id === action.messageId ? { ...m, ...action.updates } : m
                ),
              }
            : c
        ),
      };
    case 'REMOVE_LAST_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.conversationId
            ? { ...c, messages: c.messages.slice(0, -1) }
            : c
        ),
      };
    default:
      return state;
  }
}

const noop = () => {};
const noopAsync = async () => {};

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  activeConversation: null,
  activeConversationId: null,
  isGenerating: false,
  sidebarOpen: true,
  searchQuery: '',
  createNewChat: noop,
  setActiveConversation: noop,
  sendMessage: noopAsync,
  regenerateLastResponse: noopAsync,
  stopGenerating: noop,
  deleteConversation: noop,
  renameConversation: noop,
  toggleSidebar: noop,
  setSidebarOpen: noop,
  setSearchQuery: noop,
  filteredConversations: [],
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, {
    conversations: [],
    activeConversationId: null,
    isGenerating: false,
    sidebarOpen: true,
  });

  const [searchQuery, setSearchQuery] = React.useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const conversations = storage.getConversations();
    const sidebarOpen = storage.getSidebarOpen();
    dispatch({ type: 'SET_CONVERSATIONS', conversations });
    dispatch({ type: 'SET_SIDEBAR', open: sidebarOpen });
    if (conversations.length > 0) {
      dispatch({ type: 'SET_ACTIVE', id: conversations[0].id });
    }
  }, []);

  // Save to localStorage when conversations change
  useEffect(() => {
    if (state.conversations.length > 0 || storage.getConversations().length > 0) {
      storage.saveConversations(state.conversations);
    }
  }, [state.conversations]);

  useEffect(() => {
    storage.saveSidebarOpen(state.sidebarOpen);
  }, [state.sidebarOpen]);

  const activeConversation = state.conversations.find(
    c => c.id === state.activeConversationId
  ) || null;

  const filteredConversations = state.conversations.filter(c =>
    searchQuery
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  const createNewChat = useCallback(() => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'Chat Baru',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: 'ADD_CONVERSATION', conversation: newConversation });
    dispatch({ type: 'SET_ACTIVE', id: newConversation.id });
  }, []);

  const setActiveConversation = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE', id });
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    images?: ImageAttachment[],
    audioTranscript?: string
  ) => {
    let conversationId = state.activeConversationId;

    // Create new conversation if none active
    if (!conversationId) {
      const newConversation: Conversation = {
        id: generateId(),
        title: generateChatTitle(content || audioTranscript || 'Chat Baru'),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'ADD_CONVERSATION', conversation: newConversation });
      dispatch({ type: 'SET_ACTIVE', id: newConversation.id });
      conversationId = newConversation.id;
    }

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
      images,
      audioTranscript,
    };
    dispatch({ type: 'ADD_MESSAGE', conversationId, message: userMessage });

    // Update title if first message
    const conv = state.conversations.find(c => c.id === conversationId);
    if (!conv || conv.messages.length === 0) {
      dispatch({
        type: 'UPDATE_CONVERSATION',
        id: conversationId,
        updates: { title: generateChatTitle(content || audioTranscript || 'Chat Baru') },
      });
    }

    // Add assistant placeholder
    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    dispatch({ type: 'ADD_MESSAGE', conversationId, message: assistantMessage });
    dispatch({ type: 'SET_GENERATING', isGenerating: true });

    // Stream response
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Get all messages including the new user message
      const allMessages = [
        ...(conv?.messages || []),
        userMessage,
      ];

      let fullContent = '';
      for await (const chunk of streamChat(allMessages, abortController.signal)) {
        fullContent += chunk;
        dispatch({
          type: 'UPDATE_MESSAGE',
          conversationId: conversationId!,
          messageId: assistantMessageId,
          updates: { content: fullContent },
        });
      }

      dispatch({
        type: 'UPDATE_MESSAGE',
        conversationId: conversationId!,
        messageId: assistantMessageId,
        updates: { isStreaming: false },
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        dispatch({
          type: 'UPDATE_MESSAGE',
          conversationId: conversationId!,
          messageId: assistantMessageId,
          updates: { isStreaming: false },
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.';
        dispatch({
          type: 'UPDATE_MESSAGE',
          conversationId: conversationId!,
          messageId: assistantMessageId,
          updates: {
            content: `⚠️ ${errorMessage}`,
            isStreaming: false,
            isError: true,
          },
        });
      }
    } finally {
      dispatch({ type: 'SET_GENERATING', isGenerating: false });
      abortControllerRef.current = null;
    }
  }, [state.activeConversationId, state.conversations]);

  const regenerateLastResponse = useCallback(async () => {
    if (!activeConversation || activeConversation.messages.length < 2) return;

    const conversationId = activeConversation.id;
    // Remove last assistant message
    dispatch({ type: 'REMOVE_LAST_MESSAGE', conversationId });

    // Get messages without last assistant message
    const messagesWithoutLast = activeConversation.messages.slice(0, -1);
    const lastUserMessage = messagesWithoutLast[messagesWithoutLast.length - 1];

    if (!lastUserMessage || lastUserMessage.role !== 'user') return;

    // Add new assistant placeholder
    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    dispatch({ type: 'ADD_MESSAGE', conversationId, message: assistantMessage });
    dispatch({ type: 'SET_GENERATING', isGenerating: true });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let fullContent = '';
      for await (const chunk of streamChat(messagesWithoutLast, abortController.signal)) {
        fullContent += chunk;
        dispatch({
          type: 'UPDATE_MESSAGE',
          conversationId,
          messageId: assistantMessageId,
          updates: { content: fullContent },
        });
      }

      dispatch({
        type: 'UPDATE_MESSAGE',
        conversationId,
        messageId: assistantMessageId,
        updates: { isStreaming: false },
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        dispatch({
          type: 'UPDATE_MESSAGE',
          conversationId,
          messageId: assistantMessageId,
          updates: { isStreaming: false },
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan.';
        dispatch({
          type: 'UPDATE_MESSAGE',
          conversationId,
          messageId: assistantMessageId,
          updates: {
            content: `⚠️ ${errorMessage}`,
            isStreaming: false,
            isError: true,
          },
        });
      }
    } finally {
      dispatch({ type: 'SET_GENERATING', isGenerating: false });
      abortControllerRef.current = null;
    }
  }, [activeConversation]);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', id });
  }, []);

  const renameConversation = useCallback((id: string, title: string) => {
    dispatch({ type: 'UPDATE_CONVERSATION', id, updates: { title } });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'SET_SIDEBAR', open: !state.sidebarOpen });
  }, [state.sidebarOpen]);

  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR', open });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations: state.conversations,
        activeConversation,
        activeConversationId: state.activeConversationId,
        isGenerating: state.isGenerating,
        sidebarOpen: state.sidebarOpen,
        searchQuery,
        createNewChat,
        setActiveConversation,
        sendMessage,
        regenerateLastResponse,
        stopGenerating,
        deleteConversation,
        renameConversation,
        toggleSidebar,
        setSidebarOpen,
        setSearchQuery,
        filteredConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
