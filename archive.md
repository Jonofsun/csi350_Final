## Archive incase things go wrong.
# server
``` python
# server/routes.py
from flask import request, jsonify
from flask_socketio import emit, join_room
from server.app import app, socketio
from server.store import (
    CHARACTERS, new_character, find_character,
    _ability_id_gen, _equip_id_gen
)

# --- Utility: serialize Character + nested resources ---
def character_to_dict(char):
    return {
        'id': char.id,
        'name': char.name,
        'race': char.race,
        'character_class': char.character_class,
        'level': char.level,
        'abilities': [a.__dict__ for a in char.abilities],
        'equipment': [e.__dict__ for e in char.equipment]
    }

# === Character endpoints ===

@app.route('/characters', methods=['GET'])
def list_characters():
    return jsonify([character_to_dict(c) for c in CHARACTERS])

@app.route('/characters', methods=['POST'])
def create_character():
    data = request.get_json() or {}
    char = new_character(
        name=data.get('name', 'Unnamed'),
        race=data.get('race', ''),
        character_class=data.get('character_class', '')
    )
    return jsonify(character_to_dict(char)), 201

@app.route('/characters/<int:char_id>', methods=['GET'])
def get_character(char_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    return jsonify(character_to_dict(char))

@app.route('/characters/<int:char_id>', methods=['PUT', 'PATCH'])
def update_character(char_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    data = request.get_json() or {}
    for attr in ('name', 'race', 'character_class', 'level'):
        if attr in data:
            setattr(char, attr, data[attr])
    return jsonify(character_to_dict(char))

@app.route('/characters/<int:char_id>', methods=['DELETE'])
def delete_character(char_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    CHARACTERS.remove(char)
    return jsonify({}), 204

# === AbilityScore sub-resources ===

@app.route('/characters/<int:char_id>/abilities', methods=['GET'])
def list_abilities(char_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    return jsonify([a.__dict__ for a in char.abilities])

@app.route('/characters/<int:char_id>/abilities', methods=['POST'])
def create_ability(char_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    data = request.get_json() or {}
    # require name
    name = data.get('name')
    if name not in ('STR','DEX','CON','INT','WIS','CHA'):
        return jsonify({'error': 'Invalid ability name'}), 400

    new_id = next(_ability_id_gen)
    ability = type(char.abilities[0] if char.abilities else None)(
        id=new_id,
        name=name,
        score=data.get('score', 10)
    ) if char.abilities else None

    # If no existing abilities, construct using dataclass
    if ability is None:
        from server.models import AbilityScore
        ability = AbilityScore(id=new_id, name=name, score=data.get('score', 10))

    char.abilities.append(ability)
    return jsonify(ability.__dict__), 201

@app.route('/characters/<int:char_id>/abilities/<int:ability_id>',
           methods=['GET'])
def get_ability(char_id, ability_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    ability = next((a for a in char.abilities if a.id == ability_id), None)
    if not ability:
        return jsonify({'error': 'Ability not found'}), 404
    return jsonify(ability.__dict__)

@app.route('/characters/<int:char_id>/abilities/<int:ability_id>',
           methods=['PUT', 'PATCH'])
def update_ability(char_id, ability_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    ability = next((a for a in char.abilities if a.id == ability_id), None)
    if not ability:
        return jsonify({'error': 'Ability not found'}), 404

    data = request.get_json() or {}
    if 'score' in data:
        ability.score = data['score']
    return jsonify(ability.__dict__)

@app.route('/characters/<int:char_id>/abilities/<int:ability_id>',
           methods=['DELETE'])
def delete_ability(char_id, ability_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    ability = next((a for a in char.abilities if a.id == ability_id), None)
    if not ability:
        return jsonify({'error': 'Ability not found'}), 404
    char.abilities.remove(ability)
    return jsonify({}), 204

# === Equipment sub-resources ===

@app.route('/characters/<int:char_id>/equipment', methods=['GET'])
def list_equipment(char_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    return jsonify([e.__dict__ for e in char.equipment])

@app.route('/characters/<int:char_id>/equipment', methods=['POST'])
def create_equipment(char_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Equipment name is required'}), 400

    new_id = next(_equip_id_gen)
    from server.models import Equipment
    equip = Equipment(id=new_id,
                      name=name,
                      quantity=data.get('quantity', 1))
    char.equipment.append(equip)
    return jsonify(equip.__dict__), 201

@app.route('/characters/<int:char_id>/equipment/<int:equip_id>',
           methods=['GET'])
def get_equipment(char_id, equip_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    equip = next((e for e in char.equipment if e.id == equip_id), None)
    if not equip:
        return jsonify({'error': 'Equipment not found'}), 404
    return jsonify(equip.__dict__)

@app.route('/characters/<int:char_id>/equipment/<int:equip_id>',
           methods=['PUT', 'PATCH'])
def update_equipment(char_id, equip_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    equip = next((e for e in char.equipment if e.id == equip_id), None)
    if not equip:
        return jsonify({'error': 'Equipment not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        equip.name = data['name']
    if 'quantity' in data:
        equip.quantity = data['quantity']
    return jsonify(equip.__dict__)

@app.route('/characters/<int:char_id>/equipment/<int:equip_id>',
           methods=['DELETE'])
def delete_equipment(char_id, equip_id):
    char = find_character(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    equip = next((e for e in char.equipment if e.id == equip_id), None)
    if not equip:
        return jsonify({'error': 'Equipment not found'}), 404
    char.equipment.remove(equip)
    return jsonify({}), 204

# === Example Socket.IO event ===

@socketio.on('status_update')
def on_status_update(data):
    """
    Client can emit:
      socket.emit('status_update', { character_id: 1, msg: '...' })
    and the server will broadcast to all clients.
    """
    socketio.emit('broadcast_status', data)
```