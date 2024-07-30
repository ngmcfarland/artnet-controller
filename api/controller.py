from models import Nodes, Fixtures, Presets, Node, Fixture
from pyartnet import ArtNetNode, output_correction
from datetime import datetime, timedelta
from pathlib import Path
import threading
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
        self.lights_off = {
            "hour": 3,
            "minute": 0
        }
        self.threads = list()
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
        
        self.schedule_next_turn_off()
    
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
    async def _send_artnet_message(nodes: list[Node], fixture: Fixture, universes: set[int], fade: int, values: list[int]) -> bool:
        try:
            artnet_nodes = list()
            artnet_universes = dict()
            artnet_channels = list()
            num_channels = len(fixture.channels)
            if len(values) < num_channels:
                values.extend([0] * (num_channels - len(values)))
            elif len(values) > num_channels:
                logger.warning(f"Length of values greater than number of fixture channels: {len(values)} > {num_channels}")
                print(f"Length of values greater than number of fixture channels: {len(values)} > {num_channels}")
                values = values[:num_channels]
            for node in nodes:
                artnet_nodes.append(ArtNetNode(ip=node.ip_address, port=node.port,
                                               max_fps=node.max_fps, refresh_every=node.refresh_every))
                for universe in node.universes:
                    if universe in universes:
                        universe_key = f"{node.ip_address}-{universe}"
                        artnet_universes[universe_key] = artnet_nodes[-1].add_universe(universe)
                        if node.output_correction == "quadratic":
                            artnet_universes[universe_key].set_output_correction(output_correction.quadratic)
                        elif node.output_correction == "cubic":
                            artnet_universes[universe_key].set_output_correction(output_correction.cubic)
                        elif node.output_correction == "quadruple":
                            artnet_universes[universe_key].set_output_correction(output_correction.quadruple)
                for address in fixture.addresses:
                    artnet_channels.append(artnet_universes[f"{node.ip_address}-{address[0]}"].add_channel(start=address[1], width=num_channels))
            if fade <= 0:
                for c in artnet_channels:
                    try:
                        c.set_values(values)
                    except Exception:
                        logger.error(f"Failed to set values for channel {c}")
                        print(f"Failed to set values for channel {c}")
                await asyncio.sleep(0.001)
            else:
                for c in artnet_channels:
                    try:
                        c.add_fade(values, fade)
                    except Exception:
                        logger.error(f"Failed to add fade for channel {c}")
                        print(f"Failed to add fade for channel {c}")
                await artnet_channels[-1]
            return True
        except Exception as e:
            logger.error(f"Error when trying to send async Artnet message: {repr(e)}")
            print(f"Error when trying to send async Artnet message: {repr(e)}")
            return False
        
    def send_message(self, fixture_id: str, fade: int, values: list[int]) -> bool:
        fixture = self.fixtures.get(fixture_id, None)
        if fixture is None:
            logger.error(f"Failed to find fixture with id {fixture_id}")
            print(f"Failed to find fixture with id {fixture_id}")
            return
        universes = set(address[0] for address in fixture.addresses)
        nodes = [node for node in self.nodes if set(node.universes).intersection(universes)]
        if not nodes:
            logger.error(f"Failed to find nodes with matching universes: {universes}")
            print(f"Failed to find nodes with matching universes: {universes}")
            return
        return asyncio.run(self._send_artnet_message(nodes=nodes, fixture=fixture, universes=universes, fade=fade, values=values))

    def turn_lights_off(self, scheduled: bool = False) -> None:
        """
        Send all zeroes to all fixtures on all nodes.
        """
        for fixture in self.fixtures:
            print(f"Sending zeroes to fixture: {fixture.id}")
            success = self.send_message(fixture_id=fixture.id,
                                        fade=0,
                                        values=[0] * len(fixture.channels))
            print(f"Success: {success}")
        if scheduled:
            self.schedule_next_turn_off()
    
    def schedule_next_turn_off(self) -> None:
        self.threads = list()
        target = datetime.now().replace(hour=self.lights_off['hour'], minute=self.lights_off['minute'], second=0, microsecond=0)
        if datetime.now() >= target:
            target += timedelta(days=1)
        print(f"Scheduling lights off for {target.isoformat()}")
        t = threading.Timer(interval=(target-datetime.now()).total_seconds(),
                            function=self.turn_lights_off, args=(True,))
        self.threads.append(t)
        t.start()
