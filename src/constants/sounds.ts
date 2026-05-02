import { Sound } from '../types';

// Use remote URLs for built-in sounds to ensure they work in Expo Go without local asset bundling issues
export const BUILT_IN_SOUNDS: Sound[] = [
  {
    id: 'bell',
    name: 'Campana',
    uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    emoji: '🔔',
  },
  {
    id: 'crystal',
    name: 'Cristal',
    uri: 'https://assets.mixkit.co/active_storage/sfx/2187/2187-preview.mp3',
    emoji: '💎',
  },
  {
    id: 'notification',
    name: 'Clásico',
    uri: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
    emoji: '📱',
  },
  {
    id: 'chime',
    name: 'Aviso',
    uri: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    emoji: '🎵',
  },
];
