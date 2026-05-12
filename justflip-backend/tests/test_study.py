def test_submit_study_result(auth_client):
    # 1. Создаем колоду
    deck_resp = auth_client.post("/api/decks", json={"title": "Study", "description": ""})
    deck_id = deck_resp.json()["id"]

    # 2. Создаем слово
    word_resp = auth_client.post("/api/words", json={
        "term": "Test", "definition": "Test", "deck_id": deck_id
    })
    word_id = word_resp.json()["id"]

    # 3. Отправляем результат
    # В твоем main.py это POST запрос с query param word_id
    response = auth_client.post(f"/api/study/result?word_id={word_id}&difficulty=easy", json={})

    assert response.status_code == 200
    assert "next_review" in response.json()