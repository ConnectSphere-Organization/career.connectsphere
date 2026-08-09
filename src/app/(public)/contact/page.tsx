import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the ConnectSphere careers team.",
};

const contacts = [
  {
    icon: MapPin,
    title: "Location",
    value: "#51, Bhakra Road, Nangal, Punjab 140124",
  },
  {
    icon: Mail,
    title: "Email",
    value: "careers@connectsphere.in",
    href: "mailto:careers@connectsphere.in",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+91 73218 35093",
    href: "tel:+917321835093",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-slate-50 px-6 py-14 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-blue-100 bg-blue-50 px-6 py-14 text-center">
          <p className="section-kicker">Let&apos;s connect</p>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-950">
            Contact the ConnectSphere team
          </h1>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">
            Share a question, idea, or career enquiry. The right person from our
            team will get back to you.
          </p>
        </header>
        <div className="my-10 grid gap-4 md:grid-cols-3">
          {contacts.map((item) => {
            const content = (
              <>
                <item.icon className="mb-4 text-blue-600" aria-hidden="true" />
                <h2 className="font-bold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.value}
                </p>
              </>
            );
            return item.href ? (
              <a
                key={item.title}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-200"
              >
                {content}
              </a>
            ) : (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
