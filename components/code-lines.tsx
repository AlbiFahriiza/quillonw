// Code is shown as a sentence about a donut wearing a code costume. Chips are plain
// backgrounds with no padding, so every glyph stays on the 1ch grid that the typing
// reveal is measured in.
export type Token = readonly [kind: "k" | "s" | "n" | "c" | "t", text: string];
export type CodeLine = readonly Token[];

const TOKEN_CLASS = {
  k: "bg-teal",
  s: "bg-mustard",
  n: "bg-tomato",
  c: "text-ink/60",
  t: "",
} as const;

export const lineLength = (line: CodeLine) =>
  line.reduce((sum, [, text]) => sum + text.length, 0);

// Each line is clipped to its own `--n` characters. The variable lives on the line, not
// on the parent, so changing it only restyles that line. Without scripting it is unset,
// the fallback is wide, and the whole line simply shows.
export function CodeLines({ lines }: { lines: readonly CodeLine[] }) {
  return (
    <>
      {lines.map((line, index) => (
        <div
          key={index}
          data-line
          className="whitespace-pre"
          style={{ clipPath: "inset(-2px calc(100% - var(--n, 99) * 1ch) -2px 0)" }}
        >
          {line.map(([kind, text], tokenIndex) => (
            <span key={tokenIndex} className={`rounded-[2px] ${TOKEN_CLASS[kind]}`}>
              {text}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}
