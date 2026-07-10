import { create } from 'zustand';
import type { CourseAgentPendingRequest } from '../utils/buildAuditAgentHandoff';

interface CourseAgentStore {
  pendingRequest: CourseAgentPendingRequest | null;
  setPendingRequest: (request: CourseAgentPendingRequest) => void;
  consumePendingRequest: () => CourseAgentPendingRequest | null;
}

export const useCourseAgentStore = create<CourseAgentStore>((set, get) => ({
  pendingRequest: null,

  setPendingRequest: (request) => set({ pendingRequest: request }),

  consumePendingRequest: () => {
    const pending = get().pendingRequest;
    if (pending) {
      set({ pendingRequest: null });
    }
    return pending;
  },
}));
