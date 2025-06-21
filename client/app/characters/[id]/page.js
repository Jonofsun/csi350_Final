// client/app/characters/[id]/page.js
import { Suspense } from 'react';
import CharacterDetail from './CharacterDetail';

export default async function CharacterPage({ params }) {
  // params.id is the dynamic part of the URL
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <Suspense fallback={<p>Loading character details…</p>}>
        <CharacterDetail characterId={params.id} />
      </Suspense>
    </div>
  )
  
}
