import { useState, createContext, ReactNode, useContext } from "react";
import { Section } from "../Common/Types/Types.ts";

interface ResultContextType {
  rolledResult: Section | null;
  setRolledResult: (result: Section | null) => void;
}

export const ResultContext = createContext<ResultContextType | undefined>(
  undefined
);

// Define props interface for the provider
interface ResultProviderProps {
  children: ReactNode;
}

export const ResultProvider = ({ children }: ResultProviderProps) => {
  const [rolledResult, setRolledResult] = useState<Section | null>(null);

  const value: ResultContextType = {
    rolledResult,
    setRolledResult,
  };

  return (
    <ResultContext.Provider value={value}>{children}</ResultContext.Provider>
  );
};

export const useResult = (): ResultContextType => {
  const context = useContext(ResultContext);

  if (context === undefined) {
    throw new Error("Result must be used within a Child");
  }

  return context;
};
