import Link from 'next/link';
import { ArrowLeft, Download, FileClock, KeyRound } from 'lucide-react';
import history from '@/data/release-history.json';

type ReleaseSummary = {
  release_id: string;
  released_at: string;
  expires_at: string;
  key_id: string;
  listing_count: number;
  changes: { added: string[]; updated: string[]; removed: string[] };
};

function countChanges(release: ReleaseSummary) {
  return release.changes.added.length + release.changes.updated.length + release.changes.removed.length;
}

export default function ChangesPage() {
  const releases = history as ReleaseSummary[];

  return (
    <main className="changes-page">
      <header className="site-header">
        <Link className="brand-block brand-home" href="/"><span className="brand-mark" aria-hidden="true">C</span><div><p className="brand-name">Calais Open Commons</p><p className="brand-note">Données publiques vérifiables</p></div></Link>
        <Link className="directory-link" href="/"><ArrowLeft size={18} aria-hidden="true" />Retour au répertoire</Link>
      </header>

      <section className="changes-shell">
        <div className="changes-intro">
          <p className="eyebrow">Transparence des données</p>
          <h1>Modifications et exports</h1>
          <p>Chaque publication contient uniquement les fiches vérifiées et non expirées. Les fichiers signés permettent de contrôler qu’une version n’a pas été modifiée.</p>
        </div>

        <div className="export-grid" aria-label="Téléchargements des données">
          <a href="/exports/listings.json" download><Download aria-hidden="true" /><span><strong>Export JSON</strong><small>Format structuré et portable</small></span></a>
          <a href="/exports/listings.csv" download><Download aria-hidden="true" /><span><strong>Export CSV</strong><small>Compatible avec les tableurs</small></span></a>
          {releases.length > 0 ? <Link href="/releases/latest.json"><KeyRound aria-hidden="true" /><span><strong>Dernière version signée</strong><small>JSON et signature Ed25519</small></span></Link> : <div className="export-unavailable"><KeyRound aria-hidden="true" /><span><strong>Dernière version signée</strong><small>Disponible après la première publication</small></span></div>}
        </div>

        <section className="release-history" aria-labelledby="history-title">
          <div className="section-heading"><p className="eyebrow">Journal public</p><h2 id="history-title">Historique des versions</h2></div>
          {releases.length === 0 ? (
            <div className="release-empty"><FileClock size={28} aria-hidden="true" /><div><h3>Aucune version signée publiée</h3><p>Les 21 fiches importées restent hors du répertoire public jusqu’à leur vérification humaine.</p></div></div>
          ) : (
            <ol className="release-list">
              {releases.map((release) => (
                <li key={release.release_id}>
                  <div><h3>{new Date(release.released_at).toISOString().slice(0, 10)}</h3><p>{release.listing_count} fiches · {countChanges(release)} modifications · clé {release.key_id}</p></div>
                  <dl><div><dt>Ajouts</dt><dd>{release.changes.added.length}</dd></div><div><dt>Mises à jour</dt><dd>{release.changes.updated.length}</dd></div><div><dt>Retraits</dt><dd>{release.changes.removed.length}</dd></div></dl>
                  <a href={`/releases/${release.release_id}.json`}>Consulter la version</a>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </main>
  );
}
