// client/app/characters/page.js
import Link from 'next/link';

export default async function CharactersPage() {
  const res = await fetch('http://localhost:5000/characters', { cache: 'no-store' });
  const characters = await res.json();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">All Characters</h2>
      <ul className="space-y-2">
        {characters.map((c) => (
          <li key={c.id}>
            <Link
              href={`/characters/${c.id}`}
              className="text-blue-600 hover:underline"
            >
              {c.name} (Level {c.level})
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/"
        className="inline-block mt-6 text-sm text-gray-500 hover:underline"
      >
        ← Back home
      </Link>
    </div>
  );
}
