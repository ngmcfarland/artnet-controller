from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from controller import ArtnetController
from models import Node, Fixture, Preset, Transient
import logging
import socket

controller = ArtnetController()
logger = logging.getLogger(__name__)
app = FastAPI()

origins = [
    "*",
    "http://localhost",
    "http://localhost:5173",
]
try:
    hostname = socket.gethostname()
    origins.extend([
        f"http://{hostname}.local",
        f"http://{hostname}.local:5173"
    ])
except Exception as e:
    logger.warning(f"Failed to get hostname: {repr(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Nodes CRUD ---

@app.get("/api/nodes")
async def get_nodes(node_id: Annotated[str | None,  Query(alias="id")] = None):
    if node_id:
        node = controller.nodes.get(node_id, None)
        if not node:
            raise HTTPException(status_code=404, detail="Node does not exist")
        return node
    return controller.nodes


@app.post("/api/nodes")
async def add_node(node: Node):
    controller.nodes.append(node)
    controller.persist_nodes()
    return {"success": True, "id": node.id}


@app.put("/api/nodes")
async def update_node(node: Node):
    try:
        controller.nodes[node.id] = node
        controller.persist_nodes()
    except KeyError as e:
        logger.error(f"Failed to update node: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to update node: {repr(e)}")
    return {"success": True, "id": node.id}


@app.delete("/api/nodes")
async def remove_node(node: Node):
    try:
        del controller.nodes[node.id]
        controller.persist_nodes()
    except KeyError as e:
        logger.error(f"Failed to delete node: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to delete node: {repr(e)}")
    return {"success": True, "id": node.id}


# --- Fixtures CRUD ---

@app.get("/api/fixtures")
async def get_fixtures(fixture_id: Annotated[str | None,  Query(alias="id")] = None):
    if fixture_id:
        fixture = controller.fixtures.get(fixture_id, None)
        if not fixture:
            raise HTTPException(status_code=404, detail="Fixture does not exist")
        return fixture
    return controller.fixtures


@app.post("/api/fixtures")
async def add_fixture(fixture: Fixture):
    controller.fixtures.append(fixture)
    controller.persist_fixtures()
    return {"success": True, "id": fixture.id}


@app.put("/api/fixtures")
async def update_fixture(fixture: Fixture):
    try:
        controller.fixtures[fixture.id] = fixture
        controller.persist_fixtures()
    except KeyError as e:
        logger.error(f"Failed to update fixture: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to update fixture: {repr(e)}")
    return {"success": True, "id": fixture.id}


@app.delete("/api/fixtures")
async def remove_fixture(fixture: Fixture):
    try:
        del controller.fixtures[fixture.id]
        controller.persist_fixtures()
    except KeyError as e:
        logger.error(f"Failed to delete fixture: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to delete fixture: {repr(e)}")
    return {"success": True, "id": fixture.id}


# --- Presets CRUD ---

@app.get("/api/presets")
async def get_presets(preset_id: Annotated[str | None,  Query(alias="id")] = None):
    if preset_id:
        preset = controller.presets.get(preset_id, None)
        if not preset:
            raise HTTPException(status_code=404, detail="Preset does not exist")
        return preset
    return controller.presets


@app.post("/api/presets")
async def add_preset(preset: Preset):
    controller.presets.append(preset)
    controller.persist_presets()
    return {"success": True, "id": preset.id}


@app.put("/api/presets")
async def update_preset(preset: Preset):
    try:
        controller.presets[preset.id] = preset
        controller.persist_presets()
    except KeyError as e:
        logger.error(f"Failed to update preset: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to update preset: {repr(e)}")
    return {"success": True, "id": preset.id}


@app.delete("/api/presets")
async def remove_preset(preset: Preset):
    try:
        del controller.presets[preset.id]
        controller.persist_presets()
    except KeyError as e:
        logger.error(f"Failed to delete preset: {repr(e)}")
        return HTTPException(status_code=403, detail=f"Failed to delete preset: {repr(e)}")
    return {"success": True, "id": preset.id}


# --- Sending Artnet Messages ---

@app.post("/api/sendPreset")
def send_preset(preset_id: Annotated[str,  Query(alias="id")]):
    preset = controller.presets.get(preset_id, None)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset does not exist")
    success = controller.send_message(fixture_id=preset.fixture_id, fade=preset.fade, values=preset.values)
    return {"success": success}


@app.post("/api/sendTransient")
def send_transient(transient: Transient):
    success = controller.send_message(fixture_id=transient.fixture_id, fade=transient.fade, values=transient.values)
    return {"success": success}
