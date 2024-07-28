from fastapi import FastAPI, HTTPException
from controller import ArtnetController
from models import Node, Fixture, Preset, Transient
import logging

controller = ArtnetController()
logger = logging.getLogger(__name__)
app = FastAPI()


# --- Nodes CRUD ---

@app.get("/nodes")
async def get_nodes(node_id: str | None = None):
    if node_id:
        node = controller.nodes.get(node_id, None)
        if not node:
            raise HTTPException(status_code=404, detail="Node does not exist")
        return node
    return controller.nodes


@app.post("/nodes")
async def add_node(node: Node):
    controller.nodes.append(node)
    controller.persist_nodes()
    return {"success": True, "id": node.id}


@app.put("/nodes")
async def update_node(node: Node):
    try:
        controller.nodes[node.id] = node
        controller.persist_nodes()
    except KeyError as e:
        logger.error(f"Failed to update node: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to update node: {repr(e)}")
    return {"success": True, "id": node.id}


@app.delete("/nodes")
async def remove_node(node: Node):
    try:
        del controller.nodes[node.id]
        controller.persist_nodes()
    except KeyError as e:
        logger.error(f"Failed to delete node: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to delete node: {repr(e)}")
    return {"success": True, "id": node.id}


# --- Fixtures CRUD ---

@app.get("/fixtures")
async def get_fixtures(fixture_id: str | None = None):
    if fixture_id:
        fixture = controller.fixtures.get(fixture_id, None)
        if not fixture:
            raise HTTPException(status_code=404, detail="Fixture does not exist")
        return fixture
    return controller.fixtures


@app.post("/fixtures")
async def add_fixture(fixture: Fixture):
    controller.fixtures.append(fixture)
    controller.persist_fixtures()
    return {"success": True, "id": fixture.id}


@app.put("/fixtures")
async def update_fixture(fixture: Fixture):
    try:
        controller.fixtures[fixture.id] = fixture
        controller.persist_fixtures()
    except KeyError as e:
        logger.error(f"Failed to update fixture: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to update fixture: {repr(e)}")
    return {"success": True, "id": fixture.id}


@app.delete("/fixtures")
async def remove_fixture(fixture: Fixture):
    try:
        del controller.fixtures[fixture.id]
        controller.persist_fixtures()
    except KeyError as e:
        logger.error(f"Failed to delete fixture: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to delete fixture: {repr(e)}")
    return {"success": True, "id": fixture.id}


# --- Presets CRUD ---

@app.get("/presets")
async def get_presets(preset_id: str | None = None):
    if preset_id:
        preset = controller.presets.get(preset_id, None)
        if not preset:
            raise HTTPException(status_code=404, detail="Preset does not exist")
        return preset
    return controller.presets


@app.post("/presets")
async def add_preset(preset: Preset):
    controller.presets.append(preset)
    controller.persist_presets()
    return {"success": True, "id": preset.id}


@app.put("/presets")
async def update_preset(preset: Preset):
    try:
        controller.presets[preset.id] = preset
        controller.persist_presets()
    except KeyError as e:
        logger.error(f"Failed to update preset: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to update preset: {repr(e)}")
    return {"success": True, "id": preset.id}


@app.delete("/presets")
async def remove_preset(preset: Preset):
    try:
        del controller.presets[preset.id]
        controller.persist_presets()
    except KeyError as e:
        logger.error(f"Failed to delete preset: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to delete preset: {repr(e)}")
    return {"success": True, "id": preset.id}


# --- Sending Artnet Messages ---

@app.post("/sendPreset")
async def send_preset(preset_id: str):
    preset = controller.presets.get(preset_id, None)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset does not exist")
    controller.send_message(fixture_id=preset.fixture_id, fade=preset.fade, values=preset.values)
    return {"success": True}


@app.post("/sendTransient")
async def send_transient(transient: Transient):
    controller.send_message(fixture_id=transient.fixture_id, fade=transient.fade, values=transient.values)
    return {"Success": True}
