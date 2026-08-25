import type { ActivityEvent, DuplicateCandidate, IntroductionRecommendation, Person } from "@/types";

export interface PeopleRepository {
  listPeople(): Promise<Person[]>;
  saveDuplicateDecision(candidate: DuplicateCandidate): Promise<void>;
  saveIntroductionDecision(recommendation: IntroductionRecommendation): Promise<void>;
  listActivity(): Promise<ActivityEvent[]>;
}

export class LocalDemoRepository implements PeopleRepository {
  constructor(private data: { people: Person[]; activity: ActivityEvent[] }) {}
  async listPeople() { return this.data.people; }
  async listActivity() { return this.data.activity; }
  async saveDuplicateDecision() { /* Browser-local state is managed by the provider for this prototype. */ }
  async saveIntroductionDecision() { /* Browser-local state is managed by the provider for this prototype. */ }
}

export class SupabaseRepository implements PeopleRepository {
  async listPeople(): Promise<Person[]> { throw new Error("Supabase adapter requires configured credentials"); }
  async listActivity(): Promise<ActivityEvent[]> { throw new Error("Supabase adapter requires configured credentials"); }
  async saveDuplicateDecision(): Promise<void> { throw new Error("Supabase adapter requires configured credentials"); }
  async saveIntroductionDecision(): Promise<void> { throw new Error("Supabase adapter requires configured credentials"); }
}
