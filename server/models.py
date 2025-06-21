# server/models.py
from dataclasses import dataclass, field
from typing import List

@dataclass
class AbilityScore:
    id: int
    name: str       # one of "STR","DEX","CON","INT","WIS","CHA"
    score: int = 10

@dataclass
class Equipment:
    id: int
    name: str
    quantity: int = 1

@dataclass
class Character:
    id: int
    name: str
    race: str = ""
    character_class: str = ""
    level: int = 1
    abilities: List[AbilityScore] = field(default_factory=list)
    equipment: List[Equipment] = field(default_factory=list)
