import {
  layoutNextLine,
  prepareWithSegments,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from "@chenglou/pretext";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useDemoContext } from "../hooks/useDemoContext";
import { CONSTS } from "../hooks/useDemoStates";

const LOREM_IPSUM = Array(32)
  .fill(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  )
  .join(" ");

const IROHA = Array(150)
  .fill(
    "いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす",
  )
  .join("");

type Line = {
  text: string;
  rowIdx: number;
  widthPx: number;
};

export const TextOverlay = () => {
  const { atoms } = useDemoContext();
  const widths = useAtomValue(atoms.textWidths);
  const leftXs = useAtomValue(atoms.leftXs);
  const numRows = useAtomValue(atoms.rows.num);
  const startY = useAtomValue(atoms.rows.startY);
  const fontSize = useAtomValue(atoms.fontSize);
  const japanese = useAtomValue(atoms.japanese);
  const [lines, setLines] = useState<Line[]>([]);

  const preparedRef = useRef<PreparedTextWithSegments | null>(null);
  const fontSizeRef = useRef<number | null>(null);
  const japaneseRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (fontSize === fontSizeRef.current && japanese === japaneseRef.current)
      return;
    fontSizeRef.current = fontSize;
    japaneseRef.current = japanese;
    const text = japanese ? IROHA : LOREM_IPSUM;
    const fontStr = `${fontSize}px 'Roboto Condensed', sans-serif`;
    preparedRef.current = prepareWithSegments(text, fontStr);
  }, [fontSize, japanese]);

  useEffect(() => {
    if (!widths || numRows === 0 || !preparedRef.current) return;

    const prepared = preparedRef.current;
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
    const newLines: Line[] = [];

    for (let i = 0; i < numRows; i++) {
      const widthPx = widths[i];
      if (widthPx < fontSize * 2) continue;
      const line = layoutNextLine(prepared, cursor, widthPx);
      if (!line) break;
      cursor = line.end;
      newLines.push({ text: line.text, rowIdx: i, widthPx });
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(newLines);
  }, [widths, numRows, startY, fontSize, japanese]);

  if (numRows === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0">
      {lines.map(({ text, rowIdx, widthPx }) => {
        const lineHeightPx = fontSize * CONSTS.lineHeightRatio;
        const y = startY - rowIdx * lineHeightPx;
        const topPx = window.innerHeight / 2 - y - lineHeightPx / 2;
        const leftPx = leftXs?.[rowIdx] ?? 0;

        return (
          <div
            key={rowIdx}
            className="absolute overflow-hidden text-center text-white"
            style={{
              top: topPx,
              left: leftPx,
              width: widthPx,
              height: lineHeightPx,
              fontSize: fontSize,
              lineHeight: `${lineHeightPx}px`,
              fontFamily: "'Roboto Condensed', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};
