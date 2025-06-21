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
    socketio.emit(
        'ability_created',
        {'character_id': char.id, 'ability': ability.__dict__},
        room=f'character_{char.id}'
    )
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
    socketio.emit(
        'ability_updated',
        {'character_id': char.id, 'ability': ability.__dict__},
        room=f'character_{char.id}'
    )
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
    socketio.emit(
        'ability_deleted',
        {'character_id': char.id, 'ability_id': ability_id},
        room=f'character_{char.id}'
    )
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
    socketio.emit(
        'equipment_created',
        {'character_id': char.id, 'equipment': equip.__dict__},
        room=f'character_{char.id}'
    )
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
    socketio.emit(
        'equipment_updated',
        {'character_id': char.id, 'equipment': equip.__dict__},
        room=f'character_{char.id}'
    )
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
    socketio.emit(
        'equipment_deleted',
        {'character_id': char.id, 'equipment_id': equip_id},
        room=f'character_{char.id}'
    )
    return jsonify({}), 204

# === Socket.IO room join ===

@socketio.on('join_character')
def handle_join(data):
    cid = data.get('character_id')
    join_room(f'character_{cid}')
    emit('joined', {'message': f'Joined character {cid} room'}, room=f'character_{cid}')
@socketio.on('leave_character')
def handle_leave(data):
    cid = data.get('character_id')
    socketio.leave_room(f'character_{cid}')
    emit('left', {'message': f'Left character {cid} room'}, room=f'character_{cid}')
# === Error handling ===
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404
@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
@app.errorhandler(Exception)
def handle_exception(error):
    # Log the error
    app.logger.error(f"Unhandled exception: {error}")
    return jsonify({'error': 'An unexpected error occurred'}), 500
# === Socket.IO events ===
@socketio.on('connect')
def handle_connect():
    app.logger.info('Client connected')
    emit('connected', {'message': 'You are connected to the server'})
@socketio.on('disconnect')
def handle_disconnect():
    app.logger.info('Client disconnected')
    emit('disconnected', {'message': 'You have been disconnected from the server'})
@socketio.on('error')
def handle_error(error):
    app.logger.error(f"Socket.IO error: {error}")
    emit('error', {'message': 'An error occurred on the server'})