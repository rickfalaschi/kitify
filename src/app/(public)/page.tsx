import Link from "next/link";
import {
  ArrowRight,
  Package,
  Palette,
  Truck,
  Users,
  Sparkles,
  ShieldCheck,
  Globe,
  Clock,
  CreditCard,
  Heart,
  Briefcase,
  Gift,
  Check,
  Coffee,
  Shirt,
  BookOpen,
  ShoppingBag,
} from "lucide-react";
import { MobileHomeMenu } from "./_components/mobile-home-menu";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="relative">
        <Header />
        <Hero />
      </div>
      <Benefits />
      <HowItWorks />
      <KitShowcase />
      <UseCases />
      <Testimonial />
      <CTAFooter />
    </div>
  );
}

/* ---------- Header ---------- */

function Header() {
  return (
    <header className="absolute top-0 inset-x-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kitify-logo.svg"
            alt="Kitify"
            className="h-11 w-auto"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How it works
          </a>
          <a href="#benefits" className="hover:text-white transition-colors">
            Benefits
          </a>
          <a href="#use-cases" className="hover:text-white transition-colors">
            Use cases
          </a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full text-gray-200 text-sm font-medium px-4 h-9 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-sm font-semibold px-5 h-10 shadow-lg shadow-red-600/30 hover:bg-red-500 transition-colors"
          >
            Get started
          </Link>
        </div>
        <MobileHomeMenu />
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a23]">
      {/* Backblaze-style ambient gradient: deep navy with red glow at bottom */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 110%, #c81e2c 0%, #6b1322 28%, #2a0e2c 55%, #0a0a23 80%)",
        }}
      />
      {/* Subtle top vignette to deepen the navy at the very top */}
      <div className="absolute inset-x-0 top-0 h-40 -z-0 bg-gradient-to-b from-[#05051a] to-transparent" />
      {/* Soft grid texture */}
      <div
        className="absolute inset-0 -z-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 pt-36 pb-24 lg:pt-44 lg:pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-red-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Branded swag, made simple
          </span>
          <h1 className="mt-6 text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05]">
            Welcome kits your team will{" "}
            <span className="bg-gradient-to-r from-red-400 to-red-200 bg-clip-text text-transparent">
              actually love
            </span>
            .
          </h1>
          <p className="mt-6 text-lg text-gray-300 max-w-xl leading-relaxed">
            Build beautiful branded kits for employee onboarding, events and
            gifts. We design, produce and ship anywhere in the world — you just
            click order.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 text-white text-base font-semibold px-7 h-12 shadow-lg shadow-red-600/40 hover:bg-red-500 transition-colors"
            >
              Start building your kit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 text-white text-base font-semibold px-6 h-12 backdrop-blur hover:bg-white/10 transition-colors"
            >
              See how it works
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-red-400" />
              No setup fees
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-red-400" />
              Worldwide shipping
            </div>
          </div>
        </div>

        {/* Hero visual: kit preview card */}
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-tr from-red-500/30 via-red-400/10 to-transparent blur-3xl -z-10" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-medium text-gray-400">
                Welcome Kit
              </span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                <KitTile icon={Shirt} label="T-Shirt" sub="Black · L" />
                <KitTile icon={Coffee} label="Ceramic Mug" sub="White" />
                <KitTile icon={BookOpen} label="A5 Notebook" sub="Hardcover" />
                <KitTile icon={ShoppingBag} label="Tote Bag" sub="Canvas" />
              </div>
              <div className="mt-5 flex items-center justify-between rounded-lg bg-white/[0.04] border border-white/10 px-4 py-3">
                <div>
                  <p className="text-xs text-gray-400">Total per kit</p>
                  <p className="text-lg font-bold text-white">£54.00</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white text-xs font-semibold px-3 py-1.5 shadow-md shadow-red-600/30">
                  <Check className="h-3 w-3" />
                  Ready to order
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KitTile({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white/10 border border-white/10">
        <Icon className="h-6 w-6 text-red-300" />
      </div>
      <p className="mt-3 text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

/* ---------- Benefits ---------- */

function Benefits() {
  const items = [
    {
      icon: Sparkles,
      title: "Beautiful by default",
      description:
        "Our team turns your brand into mockups for every product before you order — no design work on your side.",
    },
    {
      icon: ShieldCheck,
      title: "Quality you can trust",
      description:
        "We hand-pick suppliers and inspect every kit before shipping, so what arrives matches what you approved.",
    },
    {
      icon: Globe,
      title: "Worldwide delivery",
      description:
        "Ship to your office or directly to each employee, anywhere they live. We handle customs and quotes.",
    },
    {
      icon: Clock,
      title: "Order in minutes",
      description:
        "Build a kit, choose where it goes, and pay. The whole flow takes less than 5 minutes once you're set up.",
    },
    {
      icon: CreditCard,
      title: "Transparent pricing",
      description:
        "See the price per kit as you build it. No hidden fees, no minimum order quantities, no surprises.",
    },
    {
      icon: Heart,
      title: "Made for people teams",
      description:
        "Designed by HR and ops teams who were tired of spreadsheets, vendor calls and warehouse logistics.",
    },
  ];
  return (
    <section id="benefits" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-red-50 text-red-700 text-xs font-semibold uppercase tracking-wider px-3 py-1">
            Benefits
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            Everything you need, nothing you don&apos;t.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From design to doorstep, Kitify replaces vendors, spreadsheets and
            warehouse runs with one simple platform.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <BenefitCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-6 hover:border-red-200 hover:shadow-lg hover:shadow-red-100/40 transition-all">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-600 transition-colors">
        <Icon className="h-5 w-5 text-red-600 group-hover:text-white transition-colors" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

/* ---------- How it works ---------- */

function HowItWorks() {
  const steps = [
    {
      icon: Users,
      title: "Create your brand profile",
      description:
        "Sign up, upload your logos and brand colors. Takes less than a minute.",
    },
    {
      icon: Palette,
      title: "We design your mockups",
      description:
        "Our team applies your identity to every product in our catalog so you can see exactly what you'll get.",
    },
    {
      icon: Package,
      title: "Build your kits",
      description:
        "Mix and match products, set quantities and variations. Save your kit and reuse it any time.",
    },
    {
      icon: Truck,
      title: "Order and ship",
      description:
        "Send to your office or invite employees to fill in their own address with a private link.",
    },
  ];
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-[#0a0a23] py-24"
    >
      {/* Backblaze-style ambient gradient: navy with red glow */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 110%, #c81e2c 0%, #6b1322 25%, #2a0e2c 55%, #0a0a23 80%)",
        }}
      />
      <div
        className="absolute inset-0 -z-0 opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-200 backdrop-blur">
            How it works
          </span>
          <h2 className="mt-4 text-4xl lg:text-5xl font-bold tracking-tight text-white">
            From brief to doorstep in four steps.
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Most customers go from sign-up to first kit shipped in under a week.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, i) => (
            <StepCard key={step.title} index={i + 1} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  index,
  icon: Icon,
  title,
  description,
}: {
  index: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-sm p-7 shadow-2xl shadow-black/30 overflow-hidden">
      {/* Inner red glow on hover */}
      <div className="absolute inset-0 -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-red-500/20 via-red-600/5 to-transparent" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-600/40">
            {index}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-300/80">
            Step {index}
          </span>
        </div>
        <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/10">
          <Icon className="h-5 w-5 text-red-300" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ---------- Kit Showcase ---------- */

function KitShowcase() {
  const products = [
    { icon: Shirt, name: "Apparel", count: "T-shirts, hoodies, caps" },
    { icon: Coffee, name: "Drinkware", count: "Mugs, bottles, tumblers" },
    { icon: BookOpen, name: "Stationery", count: "Notebooks, pens, planners" },
    { icon: ShoppingBag, name: "Bags", count: "Totes, backpacks, pouches" },
    { icon: Package, name: "Tech", count: "Cables, chargers, stickers" },
    { icon: Gift, name: "Extras", count: "Snacks, candles, surprises" },
  ];
  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block rounded-full bg-red-50 text-red-700 text-xs font-semibold uppercase tracking-wider px-3 py-1">
              The catalog
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
              A growing catalog of premium products.
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Mix and match across categories to build a kit that feels
              cohesive, premium and unmistakably yours.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Brand-applied previews on every product",
                "Multiple sizes, colors and finishes",
                "Configurable per kit, per item",
                "New products added every month",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700">
                    <Check className="h-3 w-3" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:border-red-300 hover:shadow-md transition-all"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                  <p.icon className="h-5 w-5 text-red-600" />
                </div>
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  {p.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{p.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Use Cases ---------- */

function UseCases() {
  const cases = [
    {
      icon: Briefcase,
      title: "New hire onboarding",
      description:
        "Welcome every new team member with a thoughtful kit that lands at their door before day one.",
    },
    {
      icon: Users,
      title: "Company events",
      description:
        "Off-sites, conferences, hackathons. Get matching swag for the whole team without lifting a finger.",
    },
    {
      icon: Gift,
      title: "Client & partner gifts",
      description:
        "Make a memorable impression. Configure once and ship to as many addresses as you need.",
    },
  ];
  return (
    <section id="use-cases" className="bg-[#0a0a23] py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-red-600/20 text-red-300 text-xs font-semibold uppercase tracking-wider px-3 py-1">
            Use cases
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white">
            Built for every moment that matters.
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Whatever you&apos;re celebrating, Kitify has you covered.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-gray-800 bg-gray-800/50 p-7 hover:border-red-500/50 hover:bg-gray-800 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600">
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">
                {c.title}
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                {c.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------- Testimonial ---------- */

function Testimonial() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-2xl lg:text-3xl font-medium text-gray-900 leading-snug">
          &ldquo;We used to spend weeks coordinating with three different
          vendors for every onboarding cycle. With Kitify, we put together a
          welcome kit on a Monday and it&apos;s on the new hire&apos;s desk the
          following week. It&apos;s honestly become one of the things people
          love most about joining us.&rdquo;
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold">
            SM
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Sarah Mitchell</p>
            <p className="text-sm text-gray-500">Head of People, Northwind</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA + Footer (shared dark canvas) ---------- */

function CTAFooter() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a23]">
      {/* Backblaze-style red glow in the upper-left corner */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 65% at 15% 0%, #ff2d3f 0%, #c81e2c 20%, #6b1322 40%, #2a0e2c 65%, #0a0a23 85%)",
        }}
      />
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 -z-0 opacity-[0.05] mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* CTA */}
      <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-24 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]">
          Start building something your team will love.
        </h2>
        <p className="mt-5 text-lg text-gray-300 max-w-2xl mx-auto">
          Create your free account and design your first kit today. No credit
          card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-red-700 text-base font-semibold px-7 h-12 shadow-xl shadow-red-900/40 hover:bg-red-50 transition-colors"
          >
            Get started for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 text-white text-base font-semibold px-6 h-12 backdrop-blur hover:bg-white/10 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2">
              <Link href="/" className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/kitify-logo.svg"
                  alt="Kitify"
                  className="h-8 w-auto"
                />
              </Link>
              <p className="mt-4 text-sm text-gray-400 max-w-sm">
                Custom branded welcome kits for companies that care about their
                people.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Product</p>
              <ul className="mt-4 space-y-3 text-sm text-gray-400">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="hover:text-white transition-colors">
                    Benefits
                  </a>
                </li>
                <li>
                  <a href="#use-cases" className="hover:text-white transition-colors">
                    Use cases
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Account</p>
              <ul className="mt-4 space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Create account
                  </Link>
                </li>
                <li>
                  <Link href="/forgot-password" className="hover:text-white transition-colors">
                    Forgot password
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Kitify. All rights reserved.</p>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </section>
  );
}
