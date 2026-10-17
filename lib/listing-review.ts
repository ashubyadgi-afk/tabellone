export const LISTING_REVIEW_ACTION_LABELS = {
  submitted: "Submitted for review",
  resubmitted: "Resubmitted for review",
  approved: "Approved",
  rejected: "Rejected",
} as const;

export type ListingReviewActionName = keyof typeof LISTING_REVIEW_ACTION_LABELS;

export function listingReviewActionLabel(action: string): string {
  if (action in LISTING_REVIEW_ACTION_LABELS) {
    return LISTING_REVIEW_ACTION_LABELS[action as ListingReviewActionName];
  }
  return action.replaceAll("_", " ");
}
