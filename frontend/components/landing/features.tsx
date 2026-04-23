import { Smartphone, BarChart3, MousePointerClick } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Deep Links",
    description:
      "Opens YouTube, Instagram, TikTok and 10+ apps directly in the native app. Works from Telegram, Instagram, and Facebook browsers.",
  },
  {
    icon: MousePointerClick,
    title: "Click Tracking",
    description:
      "Know who clicks your links, from where, on what device. Every click is logged with device type, OS, browser, and referrer.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Real-time stats dashboard. Device breakdown, deep link success rate, top browsers, referrer tracking — all in one place.",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Everything you need
        </h2>
        <p className="text-text-secondary text-center mb-16 max-w-lg mx-auto">
          Create smart links in seconds. Track everything that matters.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass p-8 rounded-2xl hover:border-border-hover transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
