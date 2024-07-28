from models import Nodes, Fixtures, Presets, Node, Fixture
from pyartnet import ArtNetNode
from pathlib import Path
import logging
import asyncio
import os

logger = logging.getLogger(__name__)
current_directory = Path(__file__).parent.resolve()


class ArtnetController:

    def __new__(cls):
        # Singleton
        if not hasattr(cls, 'instance'):
            cls.instance = super(ArtnetController, cls).__new__(cls)
        return cls.instance

    def __init__(self):
        logger.debug("Initializing Artnet Controller...")
        data_folder = current_directory / "data"
        if not data_folder.exists():
            os.mkdir(data_folder)
        # Nodes
        self.nodes_file = data_folder / "nodes.json"
        if not self.nodes_file.exists():
            self.nodes = Nodes()
            self.persist_nodes()
        else:
            with open(self.nodes_file, 'r') as f:
                self.nodes = Nodes.model_validate_json(f.read())
        # Fixtures
        self.fixtures_file = data_folder / "fixtures.json"
        if not self.fixtures_file.exists():
            self.fixtures = Fixtures()
            self.persist_fixtures()
        else:
            with open(self.fixtures_file, 'r') as f:
                self.fixtures = Fixtures.model_validate_json(f.read())
        # Presets
        self.presets_file = data_folder / "presets.json"
        if not self.presets_file.exists():
            self.presets = Presets()
            self.persist_presets()
        else:
            with open(self.presets_file, 'r') as f:
                self.presets = Presets.model_validate_json(f.read())
    
    def persist_nodes(self):
        with open(self.nodes_file, 'w') as f:
            f.write(self.nodes.model_dump_json(indent=2))
    
    def persist_fixtures(self):
        with open(self.fixtures_file, 'w') as f:
            f.write(self.fixtures.model_dump_json(indent=2))
    
    def persist_presets(self):
        with open(self.presets_file, 'w') as f:
            f.write(self.presets.model_dump_json(indent=2))
    
    @staticmethod
    async def _send_artnet_message(nodes: list[Node], fixture: Fixture, universes: set[int], fade: int, values: list[int]) -> None:
        try:
            nodes = list()
            channels = list()
            num_channels = len(fixture.channels)
            if len(values) < num_channels:
                values.extend([0] * (num_channels - len(values)))
            elif len(values) > num_channels:
                logger.warning(f"Length of values greater than number of fixture channels: {len(values)} > {num_channels}")
                values = values[:num_channels]
            for node in nodes:
                node_universes = dict()
                nodes.append(ArtNetNode(ip=node.ip_address, port=node.port,
                                        max_fps=node.max_fps, refresh_every=node.refresh_every))
                for universe in node.universes:
                    if universe in universes:
                        node_universes[str(universe)] = nodes[-1].add_universe(universe)
                for address in fixture.addresses:
                    channels.append(node_universes[str(address[0])].add_channel(start=address[1], width=num_channels))
            if fade <= 0:
                for c in channels:
                    try:
                        c.set_values(values)
                    except Exception:
                        logger.error(message=f"Failed to set values for channel {c}", level="error")
                await asyncio.sleep(0.001)
            else:
                for c in channels:
                    try:
                        c.add_fade(values, fade)
                    except Exception:
                        logger.error(message=f"Failed to add fade for channel {c}", level="error")
                await channels[-1]
        except Exception as e:
            logger.error(message=f"Error when trying to send async Artnet message: {repr(e)}", level="error")
        
    def send_message(self, fixture_id: str, fade: int, values: list[int]) -> None:
        fixture = self.fixtures.get(fixture_id, None)
        if fixture is None:
            logger.error(f"Failed to find fixture with id {fixture_id}")
            return
        universes = set(address[0] for address in fixture.addresses)
        nodes = [node for node in self.nodes if any(set(node.universes).intersection(universes))]
        if not nodes:
            logger.error(f"Failed to find nodes with matching universes: {universes}")
            return
        asyncio.run(self._send_artnet_message(nodes=nodes, fixture=fixture, universes=universes, fade=fade, values=values))
