import { useSyncExternalStore } from "react";

export type ModelStoreState = {
  modelIndex: number;
  yaw: number;
  flipX: boolean;
  placed: boolean;
};

let state: ModelStoreState = {
  modelIndex: 0,
  yaw: 0,
  flipX: false,
  placed: false,
};

const listeners = new Set<() => void>();

export function getModelState(): ModelStoreState {
  return state;
}

export function setModelState(patch: Partial<ModelStoreState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useModelStore(): ModelStoreState {
  return useSyncExternalStore(subscribe, getModelState, getModelState);
}
