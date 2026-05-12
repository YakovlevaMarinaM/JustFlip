import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import create_app

# Настройка тестовой БД в памяти (SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def auth_client(client):
    # 1. Регистрируем пользователя
    register_resp = client.post(
        "/api/register",
        json={"username": "testuser", "password": "secret123", "email": "test@example.com"}
    )
    assert register_resp.status_code == 200

    # 2. Логинимся, чтобы получить токен
    login_resp = client.post(
        "/api/login",
        data={"username": "testuser", "password": "secret123"}  # form-data, не JSON!
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # 3. Добавляем токен в заголовки клиента
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client