// src/store.js
import { create } from 'zustand';

export const useStore = create((set) => ({
  // 阶段: 'tree', 'blooming', 'nebula', 'collapsing'
  phase: 'tree',
  setPhase: (phase) => set({ phase }),

  // 手势: 'None', 'Open_Palm', 'Closed_Fist'
  handGesture: 'None',
  setHandGesture: (gesture) => set({ handGesture: gesture }),

  // ✋ 新增：轮播图旋转角度 (由手势控制)
  carouselRotation: 0,
  setCarouselRotation: (rotation) => set({ carouselRotation: rotation }),
  
  // 音乐播放状态
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}));