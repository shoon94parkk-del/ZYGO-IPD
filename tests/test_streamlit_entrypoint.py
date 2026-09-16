from pathlib import Path


def test_streamlit_entrypoint_and_render_config():
    root = Path(__file__).resolve().parents[1]

    app = root / "app.py"
    assert app.exists(), "Streamlit app.py entrypoint must exist"
    app_text = app.read_text(encoding="utf-8")
    assert "st.file_uploader" in app_text
    assert 'type=["xyz"]' in app_text or "type=['xyz']" in app_text

    pyproject = (root / "pyproject.toml").read_text(encoding="utf-8")
    assert '"streamlit>=' in pyproject
    assert '"plotly>=' in pyproject

    render = (root / "render.yaml").read_text(encoding="utf-8")
    assert "runtime: python" in render
    assert "streamlit run app.py" in render
    assert "staticPublishPath" not in render
