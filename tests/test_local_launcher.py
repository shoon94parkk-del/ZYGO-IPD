from pathlib import Path


def test_windows_launcher_uses_localhost_8501_and_src_pythonpath():
    launcher = Path("run_local.bat")
    assert launcher.exists(), "run_local.bat must exist for company-local execution"

    text = launcher.read_text(encoding="utf-8").lower()
    assert "127.0.0.1" in text
    assert "8501" in text
    assert "pythonpath" in text
    assert "streamlit run app.py" in text or "-m streamlit run app.py" in text


def test_streamlit_local_config_pins_localhost_8501():
    config = Path(".streamlit/config.toml")
    assert config.exists(), ".streamlit/config.toml must exist"

    text = config.read_text(encoding="utf-8").lower()
    assert 'address = "127.0.0.1"' in text
    assert "port = 8501" in text
