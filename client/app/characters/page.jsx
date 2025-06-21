'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CharactersPage() {
  const [chars, setChars] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/characters')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setChars)
      .catch((e) => {
        console.error(e);
        setError(e.message);
      });
  }, []);

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!chars) return <p>Loading characters…</p>;
  if (chars.length === 0) return <p>No characters yet.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">All Characters</h2>
      <ul className="space-y-2">
        {chars.map((c) => (
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
    </div>
  );
}
