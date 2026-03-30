# auth.py - функции для работы с паролями и токенами (хэширование, создание JWT - JSON Web Token).

from datetime import datetime, timedelta # Импортирует классы для работы со временем.
                                         # datetime — чтобы установить точное время истечения токена.
                                         # timedelta — чтобы добавить интервал (например, +30 минут).
from typing import Optional #Импортирует тип Optional из модуля типизации.
                            #Указать, что параметр может быть значением или None.
                            #Это нужно для аннотации типов в функции create_access_token
from jose import JWTError, jwt # Импортирует библиотеку python-jose для работы с JWT.
                               # jwt — создание (encode) и расшифровка (decode) токенов.
                               # JWTError — исключение, которое возникнет, если токен поддельный или истёк.
from passlib.context import CryptContext #Импортирует контекст для хэширования из passlib.
# Безопасное хэширование паролей алгоритмом bcrypt.
# bcrypt считается одним из наиболее безопасных методов хэширования паролей
# благодаря использованию соли и многократного хэширования.
from fastapi import Depends, HTTPException, status #FastAPI — класс для создания самого приложения.
                                    # Depends — система внедрения зависимостей (например, сессия БД, текущий пользователь).
                                    # HTTPException — для выброса ошибок с кодами (400, 401, 404).
                                    # status — готовые коды HTTP-статусов (status.HTTP_400_BAD_REQUEST).
from fastapi.security import OAuth2PasswordBearer #Это стандартная форма OAuth2 с полями username и password.
                                                       # FastAPI сам создаст UI для ввода в документации /docs.
from sqlalchemy.orm import Session #Сеанс связи с БД (через него все: add(), commit(), query(), delete())
import models, database

# === Настройки ===
SECRET_KEY = "your-secret-key-change-this-in-production"  # Секретный ключ для подписи JWT-токенов.
ALGORITHM = "HS256" #Алгоритм шифрования JWT.
ACCESS_TOKEN_EXPIRE_MINUTES = 30 #Время жизни токена в минутах

#https://habr.com/ru/articles/829742/ ОТСЮЮДААА
# Хэширование паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") #Создание контекста для хэширования паролей:
# Параметр deprecated="auto" указывает использовать рекомендованные схемы хэширования
# и автоматически обновлять устаревшие.


# OAuth2 схема (для получения токена из заголовка)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")
#Создаёт схему получения токена.
# Указывает FastAPI, что токен нужно брать из заголовка Authorization.
# tokenUrl="api/login" — связывает схему с эндпоинтом логина.
# Благодаря этому в документации /docs появляется кнопка Authorize 🔒.



# === Функции для работы с паролями ===
def verify_password(plain_password: str, hashed_password: str) -> bool: #Функция для проверки пароля
    """Проверяет, совпадает ли пароль с хэшем"""
    return pwd_context.verify(plain_password, hashed_password)



def get_password_hash(password):
    # bcrypt имеет ограничение 72 байта, обрезаем пароль если нужно
    if isinstance(password, str) and len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)
#------------------------------------------------------------------------------------------------------------------------

# === Функции для работы с токенами ===
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None): #???
    """Создаёт JWT-токен"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire}) #Добавляет поле exp (expiration) в данные токена.
# Это стандартное поле JWT. Библиотека jose автоматически проверит его при расшифровке
# и отклонит токен, если время вышло.
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM) #Подписывает и кодирует токен
    return encoded_jwt


# === Функции для работы с пользователями ===
def get_user(db: Session, username: str): # Поиск пользователя
    """Ищет пользователя в базе по username"""
    return db.query(models.User).filter(models.User.username == username).first()


def authenticate_user(db: Session, username: str, password: str):
    """Проверяет логин и пароль"""
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.password_hash ): # ???
        return False
    return user


# === Зависимость для проверки авторизации ===
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    #token — автоматически извлекается из заголовка Authorization благодаря oauth2_scheme.
    #db — сессия базы данных.
    """Получает текущего пользователя из токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, #401 UNAUTHORIZED — стандартный код "нет доступа".
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}, #WWW-Authenticate: Bearer — сигнал для клиента, что нужен токен.
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) #jwt.decode() — расшифровывает токен ключом SECRET_KEY.
        username: str = payload.get("sub")  #извлекает username из токена.
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user(db, username=username) #Токен может быть валидным, но пользователь мог быть удалён из базы.
    if user is None:
        raise credentials_exception

    return user

