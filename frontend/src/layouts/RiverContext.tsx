import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface RiverContextType {
  activeRiverId: number;
  setActiveRiverId: (id: number) => void;
}

const RiverContext = createContext<RiverContextType>({
  activeRiverId: 1,
  setActiveRiverId: () => {},
});

export function RiverProvider({ children }: { children: ReactNode }) {
  const [activeRiverId, setActiveRiverId] = useState<number>(1);
  return (
    <RiverContext.Provider value={{ activeRiverId, setActiveRiverId }}>
      {children}
    </RiverContext.Provider>
  );
}

export function useRiver() {
  return useContext(RiverContext);
}