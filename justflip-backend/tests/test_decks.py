def test_create_deck(auth_client):
    response = auth_client.post("/api/decks", json={
        "title": "Test Deck", "description": "Desc"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Deck"


def test_get_decks(auth_client):
    auth_client.post("/api/decks", json={"title": "D1", "description": ""})
    auth_client.post("/api/decks", json={"title": "D2", "description": ""})

    response = auth_client.get("/api/decks")
    assert response.status_code == 200
    assert len(response.json()) == 2