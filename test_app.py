# test_app.py

def test_home_route():
    from app import app
    client = app.test_client()
    response = client.get('/')
    assert response.status_code == 200
    assert b'Pomodoro' in response.data  # Or check for other keywords

