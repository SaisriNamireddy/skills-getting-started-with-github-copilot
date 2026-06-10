def test_root_redirect(client):
    resp = client.get("/", follow_redirects=False)
    assert resp.status_code in (301, 302, 307)
    assert resp.headers.get("location") == "/static/index.html"


def test_get_activities_returns_all(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # There should be several named activities present
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_get_activities_structure(client):
    resp = client.get("/activities")
    data = resp.json()
    # pick one activity and validate keys
    activity = data["Chess Club"]
    assert "participants" in activity
    assert isinstance(activity["participants"], list)
    assert "description" in activity
    assert "schedule" in activity
