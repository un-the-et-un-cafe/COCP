'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import registry from '@/data/association-wallet-registry.sandbox.json';
import flags from '@/data/feature-flags.json';

export default function AssociationWalletsPage() {
  const enabled = Boolean(
    (flags as { flags: { association_wallet_registry_ui: boolean } }).flags
      .association_wallet_registry_ui,
  );
  const entries = (registry as { entries: Array<Record<string, unknown>> }).entries;

  return (
    <main className="readiness-page" data-operator-only="true">
      <Link href="/readiness">
        <ArrowLeft size={16} aria-hidden /> Readiness
      </Link>
      <h1>Association wallet registry (sandbox)</h1>
      <p>
        Operator-only. Fictional orgs only. Wallet addresses are shown here for operator
        rehearsal — never on beneficiary routes. Flag association_wallet_registry_ui=
        {String(enabled)}.
      </p>
      {!enabled ? (
        <p role="status">Registry UI flag is false — documentary table only.</p>
      ) : null}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>MOU</th>
            <th>Active</th>
            <th>Chain</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={String(e.association_id)}>
              <td>{String(e.association_id)}</td>
              <td>{String(e.display_name)}</td>
              <td>{String(e.mou_flag)}</td>
              <td>{String(e.active)}</td>
              <td>{String(e.chain)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="warn-banner">
        FICTIONAL — sandbox only. No real association names. No outreach.
      </p>
    </main>
  );
}
