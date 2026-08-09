export type PublicJob = {
  id: string;
  slug: string | null;
  title: string;
  company: string;
  description: string;
  location: string | null;
  type: string | null;
  salary: string | null;
  department: string | null;
  imageUrl: string | null;
  createdAt: Date;
};

export type PublicJobDetail = PublicJob & {
  requirements: string[];
  responsibilities: string[];
  position: string | null;
  reportingManager: string | null;
  requisitionId: string | null;
  headcount: number;
  applicationDeadline: Date | null;
  publishAt: Date | null;
  hrContact: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  questions: Array<{
    id: string | null;
    questionText: string;
    questionType: "TEXT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "FILE" | "RATING";
    required: boolean;
    options: string[];
    maxRating: number;
    order: number;
  }>;
};

export type PublicJobSearchResult = {
  jobs: PublicJob[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  facets: {
    departments: Array<{ value: string; count: number }>;
    locations: Array<{ value: string; count: number }>;
    types: Array<{ value: string; count: number }>;
  };
};
