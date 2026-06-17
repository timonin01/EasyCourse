import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, StepikBlockRequest, Lesson } from '../types';

interface AIGeneratorState {
  // Mode
  mode: 'chat' | 'generate' | 'batch';
  
  // Sessions
  chatSessionId: string;
  generateSessions: Record<string, string>;
  
  // Chat history per session
  chatHistory: Record<string, ChatMessage[]>;
  
  // Current state
  stepType: string;
  generatedStep: StepikBlockRequest | null;
  selectedLessonId: number | null;
  
  // All user lessons (for lesson selection dropdown)
  allLessons: Array<Lesson & { modelTitle?: string; courseTitle?: string }>;
  
  // Actions
  setMode: (mode: 'chat' | 'generate' | 'batch') => void;
  setStepType: (stepType: string) => void;
  setGeneratedStep: (step: StepikBlockRequest | null) => void;
  setSelectedLessonId: (lessonId: number | null) => void;
  setAllLessons: (lessons: Array<Lesson & { modelTitle?: string; courseTitle?: string }>) => void;
  
  // Session management
  getOrCreateChatSession: () => string;
  setChatSession: (sessionId: string) => void;
  getOrCreateGenerateSession: (stepType: string) => string;
  setGenerateSession: (stepType: string, sessionId: string) => void;
  getCurrentSessionId: () => string;
  
  // Message management
  addMessage: (sessionId: string, message: ChatMessage) => void;
  getMessages: (sessionId: string) => ChatMessage[];
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;
  clearSession: (sessionId: string) => void;
  
  // Reset
  resetState: () => void;
}

const generateSessionId = (prefix: string) => 
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAIGeneratorStore = create<AIGeneratorState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'chat',
      chatSessionId: generateSessionId('chat'),
      generateSessions: {},
      chatHistory: {},
      stepType: 'text',
      generatedStep: null,
      selectedLessonId: null,
      allLessons: [],
      
      // Actions
      setMode: (mode) => set({ mode }),
      
      setStepType: (stepType) => set({ stepType }),
      
      setGeneratedStep: (step) => set({ generatedStep: step }),
      
      setSelectedLessonId: (lessonId) => set({ selectedLessonId: lessonId }),
      
      setAllLessons: (lessons) => set({ allLessons: lessons }),
      
      // Session management
      getOrCreateChatSession: () => {
        const state = get();
        if (!state.chatSessionId) {
          const newSessionId = generateSessionId('chat');
          set({ chatSessionId: newSessionId });
          return newSessionId;
        }
        return state.chatSessionId;
      },

      setChatSession: (sessionId: string) => set({ chatSessionId: sessionId }),
      
      getOrCreateGenerateSession: (stepType: string) => {
        const state = get();
        if (!state.generateSessions[stepType]) {
          const newSessionId = generateSessionId(`generate-${stepType}`);
          set({ 
            generateSessions: { 
              ...state.generateSessions, 
              [stepType]: newSessionId 
            } 
          });
          return newSessionId;
        }
        return state.generateSessions[stepType];
      },

      setGenerateSession: (stepType: string, sessionId: string) => {
        set((state) => ({
          generateSessions: {
            ...state.generateSessions,
            [stepType]: sessionId,
          },
        }));
      },
      
      getCurrentSessionId: () => {
        const state = get();
        if (state.mode === 'chat') {
          return state.getOrCreateChatSession();
        }
        return state.getOrCreateGenerateSession(state.stepType);
      },
      
      // Message management
      addMessage: (sessionId, message) => set((state) => ({
        chatHistory: {
          ...state.chatHistory,
          [sessionId]: [...(state.chatHistory[sessionId] || []), message],
        },
      })),
      
      getMessages: (sessionId) => {
        return get().chatHistory[sessionId] || [];
      },
      
      setMessages: (sessionId, messages) => set((state) => ({
        chatHistory: {
          ...state.chatHistory,
          [sessionId]: messages,
        },
      })),
      
      clearSession: (sessionId) => set((state) => {
        const newHistory = { ...state.chatHistory };
        delete newHistory[sessionId];
        
        // If clearing a generate session, also clear the generated step
        const isGenerateSession = sessionId.startsWith('generate-');
        
        return {
          chatHistory: newHistory,
          generatedStep: isGenerateSession ? null : state.generatedStep,
        };
      }),
      
      resetState: () => set({
        mode: 'chat',
        chatSessionId: generateSessionId('chat'),
        generateSessions: {},
        chatHistory: {},
        stepType: 'text',
        generatedStep: null,
        selectedLessonId: null,
      }),
    }),
    {
      name: 'ai-generator-storage-v2',
      partialize: (state) => ({
        mode: state.mode,
        chatSessionId: state.chatSessionId,
        generateSessions: state.generateSessions,
        stepType: state.stepType,
      }),
    }
  )
);

