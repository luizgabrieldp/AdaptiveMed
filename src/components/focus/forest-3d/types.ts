import * as THREE from 'three';

export type BotanicalSpecies =
  | 'ipe_blossom'
  | 'broad_oak'
  | 'sakura_weeping'
  | 'tropical_palm'
  | 'alpine_pine';

export interface PermanentTreeItem {
  id: string;
  colorHex: string;
  isWithered: boolean;
  area: string;
  subjectName: string | null;
  sessionDate: string;
  durationSeconds: number | null;
  modeLabel: string;
  species: BotanicalSpecies;
  scale: number;
  rotationY: number;
  x: number;
  z: number;
}

export type HoveredTarget =
  | {
      kind: 'slot';
      slotIndex: 0 | 1 | 2;
      area: string;
      subjectName: string | null;
      stageNumber: 1 | 2 | 3 | 4;
      stageLabel: string;
      liveSeconds: number;
      remainingToNextSec: number;
      hasBees: boolean;
      isActive: boolean;
      colorHex: string;
      worldPos: { x: number; y: number; z: number };
    }
  | {
      kind: 'tree';
      tree: PermanentTreeItem;
      worldPos: { x: number; y: number; z: number };
    };

export interface SharedCanopyUniforms {
  uTime: { value: number };
  uMouse3D: { value: THREE.Vector3 };
  uMouseVelocity: { value: THREE.Vector3 };
  uMouseActive: { value: number };
  uMotionScale: { value: number };
  uIsDark: { value: number };
}
