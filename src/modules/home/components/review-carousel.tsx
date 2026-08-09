"use client";

import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicReview } from "@/modules/reviews/types";

export function ReviewCarousel({ reviews }: { reviews: PublicReview[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(reviews.length / 3));

  useEffect(() => {
    if (pages <= 1) return;
    const timer = window.setInterval(
      () => setPage((current) => (current + 1) % pages),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [pages]);

  const visible = useMemo(() => {
    const start = page * 3;
    const result = reviews.slice(start, start + 3);
    if (result.length < 3 && reviews.length >= 3)
      return [...result, ...reviews.slice(0, 3 - result.length)];
    return result;
  }, [page, reviews]);

  if (reviews.length === 0) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="py-12 text-center">
          <p className="text-lg font-semibold text-slate-900">No reviews yet</p>
          <p className="mt-2 text-slate-500">
            Employee stories will appear here once approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="grid gap-6 md:grid-cols-3">
        {visible.map((review) => (
          <Card key={review.id} className="h-full">
            <CardContent className="flex h-full flex-col pt-6">
              <div
                className="flex gap-1 text-amber-400"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className="size-4"
                    fill={index < review.rating ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-950">
                {review.title}
              </h3>
              <p className="mt-3 flex-1 leading-7 text-slate-600">
                “{review.content}”
              </p>
              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-900">
                  {review.isAnonymous ? "Anonymous employee" : review.userName}
                </p>
                <p className="text-sm text-slate-500">
                  {[review.position, review.department]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {pages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setPage((page - 1 + pages) % pages)}
            aria-label="Previous reviews"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="text-sm font-medium text-slate-500">
            {page + 1} / {pages}
          </span>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setPage((page + 1) % pages)}
            aria-label="Next reviews"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
