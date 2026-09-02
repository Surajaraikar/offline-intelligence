import { OfflineMark } from "@/components/brand/OfflineMark";

export default function Loading() {
  return <div className="brand-loading" role="status" aria-label="Loading Offline Intelligence"><OfflineMark size={58} animated /><span>Loading intelligence</span></div>;
}
