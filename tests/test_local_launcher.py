from pathlib import Path


def test_windows_launcher_serves_existing_web_ui_on_localhost_8501():
    launcher = Path("run_local.bat")
    assert launcher.exists(), "run_local.bat must exist for company-local execution"

    text = launcher.read_text(encoding="utf-8").lower()
    assert "127.0.0.1" in text
    assert "8501" in text
    assert "http.server" in text
    assert "web" in text
    assert "streamlit run app.py" not in text
    assert "-m streamlit run app.py" not in text


def test_existing_browser_ui_and_xyz_file_inputs_are_preserved():
    index = Path("web/index.html")
    assert index.exists(), "existing browser UI must remain the local entrypoint"

    text = index.read_text(encoding="utf-8")
    assert "ZYGO IPD Lab" in text
    assert 'id="fileInput"' in text
    assert 'accept=".xyz,text/plain"' in text
    assert 'id="referenceInput"' in text
    assert "./app.mjs" in text
