export type PublicReview = {
  id: string;
  rating: number;
  title: string;
  content: string;
  userName: string;
  position?: string | null;
  department?: string | null;
  isAnonymous: boolean;
};
