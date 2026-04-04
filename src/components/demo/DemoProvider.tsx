import { createContext } from "react";
import {
  useDemoStates,
  type DemoAtoms,
  type DemoUniforms,
} from "./hooks/useDemoStates";

type DemoContextValue = {
  atoms: DemoAtoms;
  uniforms: DemoUniforms;
};

export const DemoContext = createContext<DemoContextValue | null>(null);

export const DemoProvider = ({ children }: { children: React.ReactNode }) => {
  const demoStates = useDemoStates();
  return (
    <DemoContext.Provider value={demoStates}>{children}</DemoContext.Provider>
  );
};
