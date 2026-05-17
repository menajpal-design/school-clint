'use client';

import React, { createContext, useContext } from 'react';

const ShellContext = createContext(false);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  return <ShellContext.Provider value={true}>{children}</ShellContext.Provider>;
}

export function useHasShell() {
  return useContext(ShellContext);
}
