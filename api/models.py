from pydantic import BaseModel, RootModel, Field
from typing import Any
from enum import Enum
from uuid import uuid4


class ChannelType(str, Enum):
    master = "master"
    red = "red"
    green = "green"
    blue = "blue"
    white_cool = "white_cool"
    white_warm = "white_warm"
    range = "range"
    discrete = "discrete"


class OutputCorrection(str, Enum):
    linear = "linear"
    quadratic = "quadratic"
    cubic = "cubic"
    quadruple = "quadruple"


class CustomRootModel(RootModel):
    root: list[Any] = []

    def __iter__(self):
        return iter(self.root)
    
    def __len__(self):
        return len(self.root)

    def __getitem__(self, key):
        if isinstance(key, int):
            if key < 0 or key >= len(self.root):
                raise IndexError(f"Invalid index: {key}")
            return self.root[key]
        elif isinstance(key, str):
            index = next((i for (i, p) in enumerate(self.root) if p.id == key), None)
            if not index:
                raise KeyError(f"ID not found: {key}")
            return self.root[index]
    
    def __setitem__(self, key, item):
        if isinstance(key, int):
            if key < 0 or key >= len(self.root):
                raise IndexError(f"Invalid index: {key}")
            self.root[key] = item
        elif isinstance(key, str):
            index = next((i for (i, p) in enumerate(self.root) if p.id == key), None)
            if not index:
                raise KeyError(f"ID not found: {key}")
            self.root[index] = item
    
    def __delitem__(self, key):
        if isinstance(key, int):
            if key < 0 or key >= len(self.root):
                raise IndexError(f"Invalid index: {key}")
            del self.root[key]
        elif isinstance(key, str):
            index = next((i for (i, p) in enumerate(self.root) if p.id == key), None)
            if not index:
                raise KeyError(f"ID not found: {key}")
            del self.root[index]
    
    def append(self, item):
        self.root.append(item)
    
    def get(self, key, default=None):
        return next((p for p in self.root if p.id == key), default)
    
    def keys(self):
        return [p.id for p in self.root]
    
    def values(self):
        return self.root


class Color(BaseModel):
    red: int
    green: int
    blue: int


class Node(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    ip_address: str
    port: int = Field(default=6454, gt=0)
    universes: list[int] = []
    max_fps: int = Field(default=50, gt=0)
    refresh_every: int = Field(default=1, gt=0)
    fade_support: bool = True
    output_correction: OutputCorrection = OutputCorrection.quadratic


class DiscreteOption(BaseModel):
    name: str
    value: int
    disabled_channels: list[int] = []
    # css_effect - future


class ArtnetChannel(BaseModel):
    name: str
    type: ChannelType
    min_value: int = Field(default=0, ge=0, lt=256)
    max_value: int = Field(default=255, ge=0, lt=256)
    options: list[DiscreteOption] = []


class Fixture(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    addresses: list[tuple[int, int]] = Field(default=[], description="List of tuples - [(universe, channel)]")
    channels: list[ArtnetChannel] = []


class Preset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    effect_name: str
    button_color: Color
    fixture_id: str
    fade: int = Field(default=0, ge=0)
    values: list[int] = []


class Transient(BaseModel):
    fixture_id: str
    fade: int = Field(default=0, ge=0)
    values: list[int] = []


class Presets(CustomRootModel):
    root: list[Preset] = []


class Nodes(CustomRootModel):
    root: list[Node] = []


class Fixtures(CustomRootModel):
    root: list[Fixture] = []
