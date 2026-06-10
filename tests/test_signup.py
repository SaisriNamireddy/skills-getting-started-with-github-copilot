from src import app as app_module


def test_signup_success(client):
    activity = "Chess Club"
    email = "testuser@example.com"

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in app_module.activities[activity]["participants"]
    assert resp.json()["message"] == f"Signed up {email} for {activity}"


def test_signup_duplicate_email(client):
    activity = "Programming Class"
    email = "duplicate@example.com"

    # first signup should succeed
    r1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r1.status_code == 200

    # second signup should fail with 400
    r2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r2.status_code == 400
    assert r2.json().get("detail") == "Student already signed up for this activity"


def test_signup_nonexistent_activity(client):
    resp = client.post("/activities/NoSuchClub/signup?email=noone@example.com")
    assert resp.status_code == 404
    assert resp.json().get("detail") == "Activity not found"


def test_unregister_success(client):
    activity = "Basketball Team"
    email = "player@example.com"

    # add participant then remove
    p1 = client.post(f"/activities/{activity}/signup?email={email}")
    assert p1.status_code == 200

    d = client.delete(f"/activities/{activity}/signup?email={email}")
    assert d.status_code == 200
    assert email not in app_module.activities[activity]["participants"]


def test_unregister_not_found(client):
    activity = "Drama Society"
    email = "ghost@example.com"

    r = client.delete(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 404
    assert r.json().get("detail") == "Participant not found"
