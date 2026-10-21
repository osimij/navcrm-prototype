import { create } from 'zustand'
import type { Segment } from './utils'

/** Segments created in this session through the segment builder. */
export const useCustomSegments = create<{ segments: Segment[]; add: (s: Segment) => void }>()((set) => ({
  segments: [],
  add: (s) => set((st) => ({ segments: [...st.segments, s] })),
}))
