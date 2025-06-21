# server/store.py
from itertools import count
from server.models import Character, AbilityScore, Equipment

# auto-incrementing IDs
_char_id_gen = count(1)
_ability_id_gen = count(1)
_equip_id_gen = count(1)

# in-memory lists
CHARACTERS: list[Character] = []

def new_character(name, race="", character_class=""):
    char = Character(
        id=next(_char_id_gen),
        name=name,
        race=race,
        character_class=character_class
    )
    CHARACTERS.append(char)
    return char

def find_character(char_id):
    return next((c for c in CHARACTERS if c.id == char_id), None)

# similar helpers for abilities & equipment...
