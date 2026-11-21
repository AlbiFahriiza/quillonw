const SPROCKET_COUNT = 8;

export function SprocketHoles() {
  return (
    <>
      {Array.from({ length: SPROCKET_COUNT }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="h-1.5 w-3 shrink-0 rounded-full bg-ink"
        />
      ))}
    </>
  );
}
