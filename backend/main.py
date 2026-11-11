import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from q_engine import SimulationEngine, generate_obstacles, ACTION_NAMES

app = FastAPI(title="Q-Learning Grid Visualizer API", version="1.0.0")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global engine instance
engine = SimulationEngine(
    grid_size=6,
    start=(0, 0),
    goal=(5, 5),
    obstacles=[(1, 1), (1, 2), (2, 4), (3, 1), (4, 3)],
    learning_rate=0.1,
    discount_factor=0.95,
    epsilon=1.0,
    epsilon_decay=0.9995,
    epsilon_min=0.05,
    state_mode="coordinate",
)


# Pydantic Request Models
class ConfigureGridRequest(BaseModel):
    grid_size: Optional[int] = None
    start: Optional[List[int]] = None
    goal: Optional[List[int]] = None
    obstacles: Optional[List[List[int]]] = None
    keep_q_table: Optional[bool] = False


class GenerateObstaclesRequest(BaseModel):
    probability: float = 0.20
    seed: Optional[int] = None


class TrainRequest(BaseModel):
    episodes: int = 1000
    max_steps: int = 100


class StepRequest(BaseModel):
    mode: str = "exploit"  # exploit, explore, train_step
    action: Optional[int] = None


class SettingsRequest(BaseModel):
    learning_rate: Optional[float] = None
    discount_factor: Optional[float] = None
    epsilon: Optional[float] = None
    epsilon_decay: Optional[float] = None
    epsilon_min: Optional[float] = None
    state_mode: Optional[str] = None
    loop_detection_enabled: Optional[bool] = None
    recovery_enabled: Optional[bool] = None
    max_episode_steps: Optional[int] = None
    visitation_bonus_enabled: Optional[bool] = None
    loop_penalty_enabled: Optional[bool] = None
    loop_penalty_amount: Optional[float] = None


@app.get("/api/status")
def get_status():
    return engine.get_summary()


@app.post("/api/grid/configure")
def configure_grid(req: ConfigureGridRequest):
    start = tuple(req.start) if req.start else None
    goal = tuple(req.goal) if req.goal else None
    obstacles = [tuple(p) for p in req.obstacles] if req.obstacles is not None else None
    
    engine.set_grid(
        grid_size=req.grid_size,
        start=start,
        goal=goal,
        obstacles=obstacles,
        keep_q_table=bool(req.keep_q_table),
    )
    return engine.get_summary()


@app.post("/api/grid/generate-obstacles")
def api_generate_obstacles(req: GenerateObstaclesRequest):
    obs = generate_obstacles(
        size=engine.grid_size,
        obstacle_probability=req.probability,
        start=engine.start,
        goal=engine.goal,
        seed=req.seed,
    )
    engine.set_grid(obstacles=obs, keep_q_table=True)
    return engine.get_summary()


@app.post("/api/train")
def train_agent(req: TrainRequest):
    result = engine.train_batch(episodes=req.episodes, max_steps=req.max_steps)
    summary = engine.get_summary()
    return {
        "batch_result": result,
        "summary": summary,
    }


@app.post("/api/simulation/reset")
def reset_simulation():
    engine.reset_simulation()
    return engine.get_summary()


@app.post("/api/simulation/reset-agent")
def reset_agent():
    engine.reset_agent()
    return engine.get_summary()


@app.post("/api/simulation/step")
def simulation_step(req: StepRequest):
    step_result = engine.step_simulation(mode=req.mode, forced_action=req.action)
    summary = engine.get_summary()
    return {
        "step": step_result,
        "summary": summary,
    }


@app.get("/api/simulation/history")
def simulation_history():
    return {
        "step_count": engine.sim_step_count,
        "history": engine.sim_history,
    }


@app.get("/api/q-table")
def get_q_table():
    return {
        "table": engine.get_full_q_table(),
        "total_states": len(engine.agent.q_table),
        "state_mode": engine.state_mode,
        "epsilon": engine.agent.epsilon,
    }


@app.get("/api/analytics")
def get_analytics():
    return {
        "episodes_history": engine.history_episodes,
        "key_states_history": dict(engine.key_states_history),
        "total_episodes": engine.training_episodes,
        "epsilon": engine.agent.epsilon,
        "q_states_count": len(engine.agent.q_table),
    }


@app.post("/api/settings")
def update_settings(req: SettingsRequest):
    if req.learning_rate is not None:
        engine.learning_rate = req.learning_rate
        engine.agent.alpha = req.learning_rate
    if req.discount_factor is not None:
        engine.discount_factor = req.discount_factor
        engine.agent.gamma = req.discount_factor
    if req.epsilon is not None:
        engine.epsilon = req.epsilon
        engine.agent.epsilon = req.epsilon
    if req.epsilon_decay is not None:
        engine.epsilon_decay = req.epsilon_decay
        engine.agent.epsilon_decay = req.epsilon_decay
    if req.epsilon_min is not None:
        engine.epsilon_min = req.epsilon_min
        engine.agent.epsilon_min = req.epsilon_min
    if req.state_mode is not None and req.state_mode != engine.state_mode:
        engine.state_mode = req.state_mode
        engine.reset_agent()
    if req.loop_detection_enabled is not None:
        engine.loop_detection_enabled = req.loop_detection_enabled
    if req.recovery_enabled is not None:
        engine.recovery_enabled = req.recovery_enabled
    if req.max_episode_steps is not None:
        engine.max_episode_steps = req.max_episode_steps
    if req.visitation_bonus_enabled is not None:
        engine.visitation_bonus_enabled = req.visitation_bonus_enabled
    if req.loop_penalty_enabled is not None:
        engine.loop_penalty_enabled = req.loop_penalty_enabled
    if req.loop_penalty_amount is not None:
        engine.loop_penalty_amount = req.loop_penalty_amount

    return engine.get_summary()


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


@app.websocket("/ws/simulation")
async def websocket_simulation(websocket: WebSocket):
    await manager.connect(websocket)
    is_running = False
    speed_ms = 400
    sim_mode = "exploit"

    # Send initial status
    await websocket.send_text(json.dumps({
        "type": "INITIAL_STATE",
        "summary": engine.get_summary(),
        "q_table": engine.get_full_q_table(),
    }))

    try:
        while True:
            # Check for incoming client messages or advance simulation if running
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=speed_ms / 1000.0 if is_running else 60.0)
                msg = json.loads(data)
                msg_type = msg.get("type")

                if msg_type == "START":
                    is_running = True
                    speed_ms = max(50, msg.get("speed_ms", speed_ms))
                    sim_mode = msg.get("mode", sim_mode)
                    if engine.sim_done:
                        engine.reset_simulation()
                    await websocket.send_text(json.dumps({
                        "type": "SIM_STATUS",
                        "status": "RUNNING",
                        "summary": engine.get_summary(),
                    }))

                elif msg_type == "PAUSE":
                    is_running = False
                    await websocket.send_text(json.dumps({
                        "type": "SIM_STATUS",
                        "status": "PAUSED",
                        "summary": engine.get_summary(),
                    }))

                elif msg_type == "RESUME":
                    is_running = True
                    if engine.sim_done:
                        engine.reset_simulation()
                    await websocket.send_text(json.dumps({
                        "type": "SIM_STATUS",
                        "status": "RUNNING",
                        "summary": engine.get_summary(),
                    }))

                elif msg_type == "STEP":
                    is_running = False
                    step_data = engine.step_simulation(mode=msg.get("mode", sim_mode))
                    await websocket.send_text(json.dumps({
                        "type": "STEP_RESULT",
                        "step": step_data,
                        "summary": engine.get_summary(),
                    }))

                elif msg_type == "RESET":
                    is_running = False
                    engine.reset_simulation()
                    await websocket.send_text(json.dumps({
                        "type": "RESET_DONE",
                        "summary": engine.get_summary(),
                    }))

                elif msg_type == "SET_SPEED":
                    speed_ms = max(50, msg.get("speed_ms", 400))

                elif msg_type == "TRAIN_STREAM":
                    # Stream batch training progress in real-time
                    episodes = msg.get("episodes", 500)
                    chunk = msg.get("chunk", 50)
                    for chunk_idx in range(0, episodes, chunk):
                        n = min(chunk, episodes - chunk_idx)
                        res = engine.train_batch(episodes=n)
                        await websocket.send_text(json.dumps({
                            "type": "TRAIN_PROGRESS",
                            "progress": {
                                "completed": chunk_idx + n,
                                "total": episodes,
                                "result": res,
                            },
                            "summary": engine.get_summary(),
                        }))
                        await asyncio.sleep(0.01)
                    
                    await websocket.send_text(json.dumps({
                        "type": "TRAIN_COMPLETE",
                        "summary": engine.get_summary(),
                        "q_table": engine.get_full_q_table(),
                    }))

            except asyncio.TimeoutError:
                # Timer fired for simulation step
                if is_running:
                    if engine.sim_done:
                        is_running = False
                        await websocket.send_text(json.dumps({
                            "type": "SIM_FINISHED",
                            "summary": engine.get_summary(),
                        }))
                    else:
                        step_data = engine.step_simulation(mode=sim_mode)
                        await websocket.send_text(json.dumps({
                            "type": "STEP_RESULT",
                            "step": step_data,
                            "summary": engine.get_summary(),
                        }))
                        if engine.sim_done:
                            is_running = False
                            await websocket.send_text(json.dumps({
                                "type": "SIM_FINISHED",
                                "summary": engine.get_summary(),
                            }))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


# Mount built frontend static files if available
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    from starlette.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("  Q-Learning Grid Visualizer Server Starting")
    print("  Open browser: http://localhost:8000")
    print("=" * 60)
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

