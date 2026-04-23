import { Link2, Zap, Share2 } from "lucide-react";

const steps = [
  {
    icon: Link2,
    step: "1",
    title: "Paste your URL",
    description: "Drop any YouTube, Instagram, TikTok, or other URL.",
  },
  {
    icon: Zap,
    step: "2",
    title: "Get a smart link",
    description: "We generate a short URL with deep linking built in.",
  },
  {
    icon: Share2,
    step: "3",
    title: "Share & track",
    description: "Every click is tracked. Apps open natively on mobile.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          How it works
        </h2>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-xs text-primary font-mono font-medium mb-2">
                Step {s.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-text-secondary text-sm">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
