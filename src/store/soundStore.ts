import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Sound } from '../types';
import { fileStorage } from '../services/storageService';
import { BUILT_IN_SOUNDS } from '../constants/sounds';

interface SoundState {
  sounds: Sound[];
  addSound: (sound: Sound) => void;
  removeSound: (id: string) => void;
  getAllSounds: () => Sound[];
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      sounds: [],
      addSound: (sound) => set((state) => ({ sounds: [...state.sounds, sound] })),
      removeSound: (id) =>
        set((state) => ({ sounds: state.sounds.filter((s) => s.id !== id) })),
      getAllSounds: () => {
        const customSounds = get().sounds;
        return [...BUILT_IN_SOUNDS, ...customSounds];
      },
    }),
    {
      name: 'custom-sounds',
      storage: createJSONStorage(() => fileStorage),
    }
  )
);
