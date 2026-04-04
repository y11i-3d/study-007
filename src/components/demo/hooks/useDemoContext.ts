import { useContext } from "react";
import { DemoContext } from "../DemoProvider";

export const useDemoContext = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemoContext must be used within DemoProvider");
  return ctx;
};
