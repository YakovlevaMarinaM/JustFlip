# настройки подключения к БД.
'''
from sqlalchemy import text #text() — это функция, которая явно сообщает SQLAlchemy
# что строка - не просто текст, а сырой SQL-запрос, который нужно выполнить в базе данных
from sqlalchemy import create_engine #Импортирует функцию create_engine из SQLAlchemy.
# Это главная функция для создания «движка» базы данных.
# Движок управляет подключением, пулом соединений и отправкой запросов.

from sqlalchemy.orm import declarative_base #Импортирует функцию для создания базового класса моделей.
# Base — это «родитель» для всех таблиц (User, Deck, Word).
# От него наследуются все модели, чтобы SQLAlchemy знал, как превратить их в таблицы.

from sqlalchemy.orm import sessionmaker #Импортирует фабрику сессий
#sessionmaker создаёт функцию SessionLocal, которая будет генерировать сеансы связи с БД для каждого запроса.


SQLALCHEMY_DATABASE_URL = "sqlite:///./justflip.db" # Задаёт строку подключения к базе данных
# sqlite - Тип базы данных (легковесная, файловая)
# :/// - Три слэша: два для протокола, один для начала пути
# ./ - Текущая папка (где лежит main.py)
# justflip.db - Имя файла базы данных

engine = create_engine( # Создаёт движок базы данных.
    # Параметры:
    # SQLALCHEMY_DATABASE_URL — куда подключаться.
    # connect_args — дополнительные аргументы для драйвера.
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # Только для SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) #Создаёт фабрику для генерации сессий БД

Параметр                               Значение                                    Зачем
autocommit=False         Не сохранять изменения автоматически          Сам решаешь, когда вызывать db.commit()
autoflush=False          Не отправлять изменения в БД перед запросами  Позволяет делать несколько операций, а потом сохранить всё разом
bind=engine                   Привязать сессии к нашему движку         Чтобы сессии знали, в какую БД подключаться

Base = declarative_base() # Создаёт базовый класс для всех моделей
#Что даёт Base:
# Метод Base.metadata.create_all() — создаёт таблицы в БД
# Связь между классами и таблицами
# Возможность делать запросы через db.query(Model)


# Функция для получения сессии БД
def get_db(): # Создаёт зависимость для внедрения сессии БД в эндпоинты
    db = SessionLocal()
    try:
        yield db # в отличие от return "замораживается", после нее выполняется позже
    finally:
        db.close()
'''
# настройки подключения к БД
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Получаем URL базы из переменной окружения (Render) или используем SQLite (локально)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./justflip.db")

# Определяем, какая база используется
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# Создаём движок
if IS_SQLITE:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # Только для SQLite
    )
else:
    # Для PostgreSQL (Render)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Проверка соединения перед использованием
        pool_recycle=3600    # Переподключение каждые 1 час
    )

# Фабрика сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()

# Зависимость для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()