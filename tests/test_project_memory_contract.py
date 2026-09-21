from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")

def test_durable_zygo_project_memory_contract():
    for path in (
        "AGENTS.md",
        "docs/project-memory.md",
        "docs/regression-guardrails.md",
        "docs/decision-log.md",
    ):
        assert (ROOT / path).exists(), path

    memory = read("docs/project-memory.md")
    guard = read("docs/regression-guardrails.md")

    for token in ("run_local.bat", "127.0.0.1:8501", "CameraRes", "µm/mm", "connect-src 'none'"):
        assert token in memory, token
    for token in ("Do not replace the approved local launcher with Streamlit", "IPD_x = C_x*dZ/dx", "Do not commit real"):
        assert token in guard, token
