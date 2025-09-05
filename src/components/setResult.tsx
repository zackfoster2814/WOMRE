import { useState, createContext, ReactNode,useContext } from "react";
import { Section } from "../Common/Types/Types.ts";

interface ZackieContextType {
  rolledResult: Section | null;
  setRolledResult: (result: Section | null) => void;
}

export const ZackieContext = createContext<ZackieContextType | undefined>(undefined);

// Define props interface for the provider
interface ZackieProviderProps {
  children: ReactNode;
}

export const ZackieProvider = ({ children }: ZackieProviderProps) => {  
  const [rolledResult, setRolledResult] = useState<Section | null>(null);
  
  const value: ZackieContextType = {
    rolledResult,
    setRolledResult
  };
  
  return (
    <ZackieContext.Provider value={value}>
      {children}
    </ZackieContext.Provider>
  );
};

// Custom hook for using the context (recommended)
export const useZackie = (): ZackieContextType => {
  const context = useContext(ZackieContext);
  
  if (context === undefined) {
    throw new Error('Zackie must be used within a Child');
  }
  
  return context;
};