// client/app/characters/[id]/page.js
import CharacterDetail from './CharacterDetail';

export default function CharacterPage({ params }) {
  // params.id is the dynamic part of the URL
  return <CharacterDetail characterId={params.id} />;
}
