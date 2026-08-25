export type PersonType = "founder" | "operator" | "investor" | "advisor" | "other";
export type LifecycleStatus = "applicant" | "member" | "alumni" | "prospect";

export type FitBreakdown = {
  leadershipRelevance: ScorePart<25>;
  experienceRelevance: ScorePart<20>;
  contributionPotential: ScorePart<20>;
  applicationQuality: ScorePart<15>;
  networkRelevance: ScorePart<10>;
  profileCompleteness: ScorePart<10>;
  total: number;
};

export type ScorePart<T extends number> = { score: number; max: T; reason: string };

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  industry?: string;
  personType?: PersonType;
  lifecycleStatus: LifecycleStatus;
  bio?: string;
  applicationAnswer?: string;
  interests: string[];
  expertise: string[];
  lookingFor: string[];
  canHelpWith: string[];
  profileSummary?: string;
  applicationQuality?: number;
  contributionPotential?: number;
  fitScore?: number;
  fitBreakdown?: FitBreakdown;
  completenessScore: number;
  dataIssues: string[];
  source: "airtable_import" | "manual" | "demo";
  enrichmentStatus: "not_started" | "processing" | "complete" | "failed";
  createdAt: string;
  updatedAt: string;
  rawRecordId?: string;
};

export type RawPersonRecord = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  company?: string;
  title?: string;
  location?: string;
  industry?: string;
  type?: string;
  status: string;
  bio?: string;
  application?: string;
  interests?: string;
  lookingFor?: string;
  canHelpWith?: string;
  createdAt: string;
};

export type DuplicateCandidate = {
  id: string;
  personAId: string;
  personBId: string;
  confidence: number;
  level: "exact" | "probable" | "possible";
  reasons: string[];
  status: "pending" | "merged" | "kept_separate" | "review_later";
};

export type IntroductionRecommendation = {
  id: string;
  personAId: string;
  personBId: string;
  score: number;
  reasons: string[];
  explanation: string;
  draftMessage: string;
  status: "suggested" | "approved" | "dismissed" | "introduced";
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  type: "import" | "normalize" | "enrich" | "duplicate" | "merge" | "separate" | "fit" | "introduction";
  title: string;
  detail: string;
  createdAt: string;
};

export type ProcessingStage = "idle" | "normalizing" | "quality" | "classifying" | "scoring" | "matching" | "complete";
