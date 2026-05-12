def test_register_success(client):
    response = client.post("/api/register", json={
        "username": "newuser", "password": "pass123", "email": "new@test.com"
    })
    assert response.status_code == 200

def test_login_success(client):
    # Сначала регистрируем
    client.post("/api/register", json={
        "username": "loginuser", "password": "pass123", "email": "l@test.com"
    })
    # Потом логинимся
    response = client.post("/api/login", data={
        "username": "loginuser", "password": "pass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()