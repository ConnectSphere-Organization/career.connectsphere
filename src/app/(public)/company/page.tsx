import type { Metadata } from "next";

import { publishedCareerContent } from "@/modules/engagement/server/engagement";

export const metadata: Metadata = {
  title: "Life at ConnectSphere",
  description:
    "Explore ConnectSphere teams, culture, values, benefits, employee stories, hiring process, accommodations, and FAQs.",
};

export default async function CompanyPage() {
  const content = await publishedCareerContent();
  const groups = content.reduce((map, item) => {
    const items = map.get(item.type) ?? [];
    items.push(item);
    map.set(item.type, items);
    return map;
  }, new Map<(typeof content)[number]["type"], typeof content>());
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-3xl border-b border-slate-200 pb-8">
        <p className="section-kicker">Life at ConnectSphere</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Understand the company before you apply
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Teams, locations, values, benefits, employee stories, the hiring
          process, accommodations, and frequently asked questions are managed as
          publishable career content.
        </p>
      </header>
      {content.length ? (
        <div className="mt-10 space-y-12">
          {[...groups].map(([type, items]) => (
            <section key={type} aria-labelledby={`content-${type}`}>
              <h2
                id={`content-${type}`}
                className="text-xl font-semibold text-slate-950"
              >
                {type.replaceAll("_", " ")}
              </h2>
              <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-2 py-5 md:grid-cols-[15rem_1fr]"
                  >
                    <h3 className="font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <div>
                      <p className="text-sm leading-6 text-slate-600">
                        {item.summary ?? "Published company information"}
                      </p>
                      {item.location ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.location}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-lg border border-slate-200 bg-white p-8">
          <h2 className="font-semibold text-slate-950">
            Career content is being prepared
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            No company content has been published yet. Draft and publish records
            through the administration API.
          </p>
        </div>
      )}
    </div>
  );
}
