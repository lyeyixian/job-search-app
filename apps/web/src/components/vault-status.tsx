import { getHealth } from "@/api/client";
import { RefreshControl } from "./refresh-control";

/**
 * The time of the last update from the vault, with Refresh. The feature is criterion 6 of
 * docs/features/every-page.md. The time is read on each request and after each Refresh.
 */
export async function VaultStatus() {
  const result = await getHealth();
  return <RefreshControl loadedAt={result.ok ? result.data.vault.loadedAt : null} />;
}
