import { EmptyState } from "../../components/ui/EmptyState";

export function PlatformPage() {
  return (
    <section className="dashboard-page">
      <header className="dashboard-header dashboard-header--platform">
        <div>
          <p className="eyebrow">Platform overview</p>
          <h1>Platform</h1>
        </div>
      </header>
      <EmptyState
        title="Platform reporting is unavailable."
        description="The API does not expose platform-wide summary data."
      />
    </section>
  );
}
