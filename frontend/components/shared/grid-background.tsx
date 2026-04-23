export function GridBackground({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
