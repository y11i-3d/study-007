import { createContext, useContext, useMemo } from "react";

type ThreeContextValue = {
  atoms: object;
  uniforms: object;
};

const ThreeContext = createContext<ThreeContextValue | null>(null);

export const ThreeProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo(
    () => ({
      atoms: {},
      uniforms: {},
    }),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <ThreeContext.Provider value={value}>{children}</ThreeContext.Provider>
  );
};

export const useThreeContext = () => {
  const ctx = useContext(ThreeContext);
  if (!ctx)
    throw new Error("useThreeContext must be used within ThreeProvider");
  return ctx;
};
