import { createContext, useContext } from 'react';
import {
  browserSharingAdapter,
  type SharingAdapter,
} from './sharingAdapter';

export const SharingAdapterContext = createContext<SharingAdapter>(
  browserSharingAdapter,
);

export function useSharingAdapter(): SharingAdapter {
  return useContext(SharingAdapterContext);
}
