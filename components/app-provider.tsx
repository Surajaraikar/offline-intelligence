"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { processDemoDataset } from "@/lib/data/process";
import type { ActivityEvent, DuplicateCandidate, IntroductionRecommendation, Person, ProcessingStage } from "@/types";

type AppState = {
  people: Person[];
  duplicates: DuplicateCandidate[];
  introductions: IntroductionRecommendation[];
  activity: ActivityEvent[];
  loading: boolean;
  stage: ProcessingStage;
  lastProcessed?: string;
  toast?: string;
  processDataset: () => Promise<void>;
  decideDuplicate: (id: string, status: DuplicateCandidate["status"]) => void;
  decideIntroduction: (id: string, status: IntroductionRecommendation["status"]) => void;
  regenerateDraft: (id: string) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  reprocessPerson: (id: string) => void;
  notify: (message: string) => void;
};

const AppContext = createContext<AppState | null>(null);
const STORAGE_KEY = "offline-intelligence-decisions-v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [introductions, setIntroductions] = useState<IntroductionRecommendation[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [lastProcessed, setLastProcessed] = useState<string>();
  const [toast, setToast] = useState<string>();

  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(undefined), 2600); }, []);

  const load = useCallback(async () => {
    const result = await processDemoDataset();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as { duplicates?: Record<string, DuplicateCandidate["status"]>; introductions?: Record<string, IntroductionRecommendation["status"]> };
      result.duplicates = result.duplicates.map((item) => ({ ...item, status: saved.duplicates?.[item.id] || item.status }));
      result.introductions = result.introductions.map((item) => ({ ...item, status: saved.introductions?.[item.id] || item.status }));
    } catch { /* Ignore malformed browser-local demo state. */ }
    setPeople(result.people); setDuplicates(result.duplicates); setIntroductions(result.introductions); setActivity(result.activity);
    setLastProcessed(new Date().toISOString()); setLoading(false); setStage("complete");
  }, []);

  useEffect(() => {
    // Seed the browser-local repository after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const persist = useCallback((dups: DuplicateCandidate[], intros: IntroductionRecommendation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      duplicates: Object.fromEntries(dups.map((item) => [item.id, item.status])),
      introductions: Object.fromEntries(intros.map((item) => [item.id, item.status])),
    }));
  }, []);

  const processDataset = useCallback(async () => {
    const stages: ProcessingStage[] = ["normalizing", "quality", "classifying", "scoring", "matching"];
    setLoading(false);
    for (const next of stages) { setStage(next); await new Promise((resolve) => window.setTimeout(resolve, 420)); }
    await load(); notify("Sample dataset processed successfully");
  }, [load, notify]);

  const decideDuplicate = useCallback((id: string, status: DuplicateCandidate["status"]) => {
    setDuplicates((current) => { const next = current.map((item) => item.id === id ? { ...item, status } : item); persist(next, introductions); return next; });
    const title = status === "merged" ? "Merge approved" : status === "kept_separate" ? "Records kept separate" : "Saved for later review";
    setActivity((current) => [{ id: `evt-${Date.now()}`, type: status === "merged" ? "merge" : "separate", title, detail: "Decision saved to local demo state; source records remain auditable", createdAt: new Date().toISOString() }, ...current]);
    notify(`${title}. You can change this decision anytime.`);
  }, [introductions, notify, persist]);

  const decideIntroduction = useCallback((id: string, status: IntroductionRecommendation["status"]) => {
    setIntroductions((current) => { const next = current.map((item) => item.id === id ? { ...item, status } : item); persist(duplicates, next); return next; });
    const item = introductions.find((intro) => intro.id === id);
    setActivity((current) => [{ id: `evt-${Date.now()}`, type: "introduction", title: status === "approved" ? "Introduction approved" : "Introduction dismissed", detail: item ? `Recommendation ${item.id} reviewed by operator` : "Recommendation reviewed", createdAt: new Date().toISOString() }, ...current]);
    notify(status === "approved" ? "Introduction approved — no message was sent" : "Recommendation dismissed");
  }, [duplicates, introductions, notify, persist]);

  const regenerateDraft = useCallback((id: string) => {
    setIntroductions((current) => current.map((item) => item.id === id ? { ...item, draftMessage: `${item.draftMessage.split("I'll leave")[0]}Feel free to take it from here if this feels useful.` } : item));
    notify("A fresh Demo AI draft is ready");
  }, [notify]);

  const updatePerson = useCallback((id: string, updates: Partial<Person>) => { setPeople((current) => current.map((person) => person.id === id ? { ...person, ...updates, updatedAt: new Date().toISOString() } : person)); notify("Profile updates saved for this demo session"); }, [notify]);
  const reprocessPerson = useCallback((id: string) => { setPeople((current) => current.map((person) => person.id === id ? { ...person, enrichmentStatus: "complete", updatedAt: new Date().toISOString() } : person)); notify("Profile reprocessed with Demo AI"); }, [notify]);

  const value = useMemo(() => ({ people, duplicates, introductions, activity, loading, stage, lastProcessed, toast, processDataset, decideDuplicate, decideIntroduction, regenerateDraft, updatePerson, reprocessPerson, notify }), [people, duplicates, introductions, activity, loading, stage, lastProcessed, toast, processDataset, decideDuplicate, decideIntroduction, regenerateDraft, updatePerson, reprocessPerson, notify]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
