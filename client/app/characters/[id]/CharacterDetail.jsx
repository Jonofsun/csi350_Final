// client/app/characters/[id]/CharacterDetail.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';

export default function CharacterDetail({ characterId }) {
  const [char, setChar]   = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef();

  // Fetch + socket setup
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`http://localhost:5000/characters/${characterId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setChar(await res.json());
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();

    socketRef.current = io('http://localhost:5000');
    socketRef.current.on('broadcast_status', (data) => {
      if (data.character_id === Number(characterId)) {
        load();
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [characterId]);

  const emitUpdate = () => {
    socketRef.current.emit('status_update', { character_id: Number(characterId) });
  };

  // Abilities CRUD
  const addAbility = async (e) => {
    e.preventDefault();
    const { name, score } = Object.fromEntries(new FormData(e.target));
    try {
      const res = await fetch(
        `http://localhost:5000/characters/${characterId}/abilities`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, score: Number(score) }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newAbility = await res.json();
      setChar((c) => ({ ...c, abilities: [...c.abilities, newAbility] }));
      emitUpdate();
      e.target.reset();
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  const updateAbility = async (id, newScore) => {
    try {
      const res = await fetch(
        `http://localhost:5000/characters/${characterId}/abilities/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: Number(newScore) }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setChar((c) => ({
        ...c,
        abilities: c.abilities.map((a) => (a.id === id ? updated : a)),
      }));
      emitUpdate();
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  const deleteAbility = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/characters/${characterId}/abilities/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setChar((c) => ({
        ...c,
        abilities: c.abilities.filter((a) => a.id !== id),
      }));
      emitUpdate();
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  // Equipment CRUD
  const addEquipment = async (e) => {
    e.preventDefault();
    const { name, quantity } = Object.fromEntries(new FormData(e.target));
    try {
      const res = await fetch(
        `http://localhost:5000/characters/${characterId}/equipment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, quantity: Number(quantity) }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newEquip = await res.json();
      setChar((c) => ({ ...c, equipment: [...c.equipment, newEquip] }));
      emitUpdate();
      e.target.reset();
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  const updateEquipment = async (id, newQty) => {
    try {
      const res = await fetch(
        `http://localhost:5000/characters/${characterId}/equipment/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: Number(newQty) }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setChar((c) => ({
        ...c,
        equipment: c.equipment.map((e) => (e.id === id ? updated : e)),
      }));
      emitUpdate();
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  const deleteEquipment = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:5000/characters/${characterId}/equipment/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setChar((c) => ({
        ...c,
        equipment: c.equipment.filter((e) => e.id !== id),
      }));
      emitUpdate();
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  };

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (loading || !char) return <p>Loading character…</p>;

  return (
    <div className="space-y-6">
      {/* Character Info */}
      <section>
        <h2 className="text-3xl font-bold">{char.name}</h2>
        <p>
          Race: {char.race} | Class: {char.character_class} | Level: {char.level}
        </p>
      </section>

      {/* Abilities List + Form */}
      <section>
        <h3 className="text-2xl font-semibold">Abilities</h3>
        <ul className="grid grid-cols-3 gap-4">
          {char.abilities.map((a) => (
            <li
              key={a.id}
              className="p-4 bg-white rounded shadow flex flex-col"
            >
              <strong>{a.name}</strong>
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="number"
                  defaultValue={a.score}
                  onBlur={(e) => updateAbility(a.id, e.target.value)}
                  className="w-16 border rounded p-1"
                />
                <button
                  onClick={() => deleteAbility(a.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={addAbility} className="mt-4 flex space-x-2">
          <select
            name="name"
            required
            className="border rounded p-1"
            defaultValue=""
          >
            <option value="" disabled>
              Ability
            </option>
            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
          <input
            name="score"
            type="number"
            defaultValue={10}
            required
            className="w-20 border rounded p-1"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Add Ability
          </button>
        </form>
      </section>

      {/* Equipment List + Form */}
      <section>
        <h3 className="text-2xl font-semibold">Equipment</h3>
        <ul className="space-y-2">
          {char.equipment.map((e) => (
            <li
              key={e.id}
              className="p-4 bg-white rounded shadow flex justify-between items-center"
            >
              <div>
                <span>{e.name}</span>{' '}
                <input
                  type="number"
                  defaultValue={e.quantity}
                  onBlur={(ev) => updateEquipment(e.id, ev.target.value)}
                  className="w-16 border rounded p-1"
                />
              </div>
              <button
                onClick={() => deleteEquipment(e.id)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addEquipment} className="mt-4 flex space-x-2">
          <input
            name="name"
            type="text"
            placeholder="Item name"
            required
            className="border rounded p-1"
          />
          <input
            name="quantity"
            type="number"
            defaultValue={1}
            required
            className="w-20 border rounded p-1"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Add Equipment
          </button>
        </form>
      </section>

      <Link href="/characters" className="text-blue-600 hover:underline">
        ← Back to Characters
      </Link>
    </div>
  );
}
