// client/app/characters/[id]/CharacterDetail.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';

export default function CharacterDetail({ characterId }) {
  const [char,       setChar]       = useState(null);
  const [statusMsg, setStatusMsg]  = useState('');
  const [errorMsg,  setErrorMsg]   = useState('');
  const socketRef = useRef();

  // initial load + socket wiring
  useEffect(() => {
    // --- fetch character w/ robust error‐handling ---
    const load = async () => {
      try {
        const res     = await fetch(`http://localhost:5000/characters/${characterId}`);
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);
        setChar(payload);
        setErrorMsg('');
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message);
      }
    };
    load();

    // --- connect & join room ---
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join_character', { character_id: Number(characterId) });

    // --- listen for server socket events ---
    socket.on('connected',    ({ message }) => setStatusMsg(message));
    socket.on('disconnected', ({ message }) => setStatusMsg(message));
    socket.on('error',        ({ message }) => setErrorMsg(message));
    socket.on('left',         ({ message }) => setStatusMsg(message));

    // --- existing handlers for ability & equipment events ---
    socket.on('ability_created', ({ ability }) => {
      setChar(c => ({ ...c, abilities: [...c.abilities, ability] }));
    });
    socket.on('ability_updated', ({ ability }) => {
      setChar(c => ({
        ...c,
        abilities: c.abilities.map(a => a.id === ability.id ? ability : a)
      }));
    });
    socket.on('ability_deleted', ({ ability_id }) => {
      setChar(c => ({
        ...c,
        abilities: c.abilities.filter(a => a.id !== ability_id)
      }));
    });

    // handlers for equipment events
    socket.on('equipment_created', ({ equipment }) => {
      setChar(c => ({ ...c, equipment: [...c.equipment, equipment] }));
    });
    socket.on('equipment_updated', ({ equipment }) => {
      setChar(c => ({
        ...c,
        equipment: c.equipment.map(e => e.id === equipment.id ? equipment : e)
      }));
    });
    socket.on('equipment_deleted', ({ equipment_id }) => {
      setChar(c => ({
        ...c,
        equipment: c.equipment.filter(e => e.id !== equipment_id)
      }));
    });

    return () => {
      // leave room before disconnecting
      socket.emit('leave_character', { character_id: Number(characterId) });
      socket.disconnect();
    };
  }, [characterId]);

  // --- manual leave room action ---
  const leaveRoom = () => {
    socketRef.current?.emit('leave_character', {
      character_id: Number(characterId)
    });
  };

  // mutation helpers now just call the REST API; the server will emit events
  const addAbility = async (e) => {
    e.preventDefault();
    try {
      await fetch(
        `http://localhost:5000/characters/${characterId}/abilities`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
        }
      );
      e.target.reset();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    }
  };

  const updateAbility = async (id, score) => {
    try {
      await fetch(
        `http://localhost:5000/characters/${characterId}/abilities/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: Number(score) }),
        }
      );
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    }
  };

  const deleteAbility = async (id) => {
    try {
      await fetch(
        `http://localhost:5000/characters/${characterId}/abilities/${id}`,
        { method: 'DELETE' }
      );
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    }
  };

  const addEquipment = async (e) => {
    e.preventDefault();
    try {
      await fetch(
        `http://localhost:5000/characters/${characterId}/equipment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
        }
      );
      e.target.reset();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    }
  };

  const updateEquipment = async (id, qty) => {
    try {
      await fetch(
        `http://localhost:5000/characters/${characterId}/equipment/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: Number(qty) }),
        }
      );
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    }
  };

  const deleteEquipment = async (id) => {
    try {
      await fetch(
        `http://localhost:5000/characters/${characterId}/equipment/${id}`,
        { method: 'DELETE' }
      );
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message);
    }
  };

  // --- render errors / loading ---
  if (errorMsg) return <p className="text-red-600">Error: {errorMsg}</p>;
  if (!char)    return <p>Loading character…</p>;

  return (
    <div className="space-y-6">
      {/* status bar */}
      {statusMsg && (
        <div className="p-2 bg-blue-100 text-blue-800 rounded">
          {statusMsg}
        </div>
      )}

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
            <li key={a.id} className="p-4 bg-white rounded shadow flex flex-col">
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
          <select name="name" required className="border rounded p-1" defaultValue="">
            <option value="" disabled>Ability</option>
            {['STR','DEX','CON','INT','WIS','CHA'].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
          <input name="score" type="number" defaultValue={10} required className="w-20 border rounded p-1" />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
            Add Ability
          </button>
        </form>
      </section>

      {/* Equipment List + Form */}
      <section>
        <h3 className="text-2xl font-semibold">Equipment</h3>
        <ul className="space-y-2">
          {char.equipment.map((e) => (
            <li key={e.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
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
          <input name="name" type="text" placeholder="Item name" required className="border rounded p-1" />
          <input name="quantity" type="number" defaultValue={1} required className="w-20 border rounded p-1" />
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
            Add Equipment
          </button>
        </form>
      </section>

      <button
        onClick={leaveRoom}
        className="mt-4 px-3 py-1 bg-red-500 text-white rounded"
      >
        Leave Live Updates
      </button>

      <Link href="/characters" className="block text-blue-600 hover:underline">
        ← Back to Characters
      </Link>
    </div>
  );
}
