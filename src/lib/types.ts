

import type { Timestamp } from 'firebase/firestore';
import type { DerivationStep as EncryptionStep } from './encryption';

// Renaming here to avoid conflict if DerivationStep is used elsewhere
export type DerivationStep = EncryptionStep;


export interface UserProfile {
  id: string;
  username: string;
  password?: string; // Made optional as it's not always needed client-side
  role: 'commander' | 'sub-commander';
  assignedUnitId?: string;
  canSeeAllUnits?: boolean;
}

export interface MilitaryUnit {
  id: string;
  name: string;
  commanderId: string;
  status: 'operational' | 'offline' | 'alert';
  latitude: number;
  longitude: number;
  mapId: string; // To associate unit with a specific map
  encryptionKey?: string; // Key to decrypt the coordinates, commander's password in this case
}

export interface OperationTarget {
  id:string;
  name: string;
  assignedUnitId: string;
  latitude: number; // This will store the Y percentage
  longitude: number; // This will store the X percentage
  status: 'pending' | 'active' | 'passive';
  mapId: string; // To associate target with a specific map
}

export type TacticalIconType = 'tank' | 'hq' | 'jet' | 'infantry' | 'artillery' | 'helicopter' | 'objective' | 'home';

export interface TacticalIconOnMap {
    id: string;
    type: TacticalIconType;
    label: string;
    latitude: number;
    longitude: number;
    mapId: string;
}


export interface Decoy {
  id: string;
  publicName: string; // e.g. "Bölük Alfa"
  latitude: number; // Encrypted latitude
  longitude: number; // Encrypted longitude
  operationTargetId: string;
  derivationSteps: DerivationStep[]; // The fake steps for the UI
  originalLat: number; // Store original for decryption verification
  originalLng: number; // Store original for decryption verification
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  timestamp: Timestamp;
  encryptedText: string; // Will store a JSON string of the encrypted number array
}

export interface Conversation {
  id: string;
  participants: string[]; // array of user IDs
  participantDetails: { id: string; username: string; role: 'commander' | 'sub-commander' }[];
  lastMessage?: {
    timestamp: Timestamp;
    senderId: string;
    encryptedText: string;
  };
  // Tracks unread messages for each participant
  unreadCount?: {
    [userId: string]: number;
  };
}

export interface SuspiciousActivity {
    id: string;
    userId: string;
    username: string;
    ipAddress: string;
    timestamp: Timestamp;
    location: string;
    seen: boolean;
}

export interface ActiveSession {
    id: string; // Should be the user ID
    sessionId: string;
    timestamp: Timestamp;
}

    
