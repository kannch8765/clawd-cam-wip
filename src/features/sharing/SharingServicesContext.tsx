import { type PropsWithChildren } from 'react';
import { browserSharingAdapter, type SharingAdapter } from './sharingAdapter';
import { SharingAdapterContext } from './sharingServices';

interface SharingServicesProviderProps extends PropsWithChildren {
  adapter?: SharingAdapter;
}

export function SharingServicesProvider({
  adapter = browserSharingAdapter,
  children,
}: SharingServicesProviderProps) {
  return (
    <SharingAdapterContext.Provider value={adapter}>
      {children}
    </SharingAdapterContext.Provider>
  );
}
