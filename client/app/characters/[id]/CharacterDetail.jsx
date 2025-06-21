// client/app/characters/[id]/CharacterDetail.jsx
'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';

export default function CharacterDetail({ characterId }) {
  const [char, setChar] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    // Fetch initial data
    async function load() {
      const res = await fetch(`http://localhost:5000/characters/${characterId}`);
      if (res.ok) setChar(await res.json());
    }
    load();

    // Listen for broadcasts for this character
    socket.on('broadcast_status', data => {
      if (data.character_id === Number(characterId)) {
        load();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [characterId]);

  if (!char) return <p>Loading…</p>;

  return (
    <div>
      <h2>{char.name}</h2>
      <p>Race: {char.race} Class: {char.character_class} Level: {char.level}</p>

      <h3>Abilities</h3>
      <ul>
        {char.abilities.map(a => (
          <li key={a.id}>
            {a.name}: {a.score}
          </li>
        ))}
      </ul>

      <h3>Equipment</h3>
      <ul>
        {char.equipment.map(e => (
          <li key={e.id}>{e.name} ×{e.quantity}</li>
        ))}
      </ul>

      <Link href="/characters">← Back to list</Link>
    </div>
  );
}
