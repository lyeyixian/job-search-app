"use client";

import { useEffect, useState } from "react";

const REVIEW_MONTHS = 3;

/**
 * True if `updated` is more than three months before `now`. `updated` is a day, `YYYY-MM-DD`,
 * or a month, `YYYY-MM`. A month has no day, so a month counts in whole months: a direction
 * from October is due from February.
 */
export function reviewDue(updated: string, now: Date): boolean {
  const [year = 0, month = 1, day] = updated.split("-").map(Number);
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (day === undefined) return months > REVIEW_MONTHS;
  return months > REVIEW_MONTHS || (months === REVIEW_MONTHS && now.getDate() > day);
}

/** Tells the person that the direction is due for a review. It reads the day from the device. */
export function ReviewReminder({ updated }: { updated: string }) {
  const [due, setDue] = useState(false);
  useEffect(() => setDue(reviewDue(updated, new Date())), [updated]);

  if (!due) return null;
  return (
    <p
      role="status"
      className="rounded-md border border-amber-300 bg-amber-100 px-3 py-2 text-amber-900 text-sm"
      data-testid="review-due"
    >
      The direction is due for a review. Its last update is more than three months ago.
    </p>
  );
}
