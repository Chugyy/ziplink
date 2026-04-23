import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Zap className="w-4 h-4" />
          Ziplink
        </div>
        <p className="text-text-muted text-sm">
          Built by Hugo
        </p>
      </div>
    </footer>
  );
}
