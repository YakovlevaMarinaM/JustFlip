# models.py - модели таблиц БД (User, Deck, Word).

from sqlalchemy import Date, Column, Integer, String, ForeignKey, DateTime, Text # для создания столбцов + разные типы данных
from sqlalchemy.orm import relationship # Импортирует инструмент для создания связей между таблицами
from datetime import datetime #Импортирует класс для работы с датой и временем
from database import Base #Импортирует базовый класс из database.py.
# Все модели наследуются от Base, чтобы SQLAlchemy знал, что это таблицы, а не обычные классы.


class User(Base): # Объявляет класс User и имя таблицы в базе (наследуется от Base).
# Класс: User (используется в коде Python)
    __tablename__ = "users" # Таблица: "users" (имя в базе данных, обычно во множественном числе)

    id = Column(Integer, primary_key=True, index=True) # первичный ключ автоматически увеличивается: 1, 2, 3...
                                                       # индекс - ускоряет поиск по этому полю
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String) # у разных пользователей могут быть одинаковые пароли (хэши будут разными из-за соли).


    current_streak = Column(Integer, default=0)  # Текущая серия
    longest_streak = Column(Integer, default=0)  # Лучшая серия
    last_study_date = Column(Date, nullable=True)  # Последняя дата учёбы

    created_at = Column(DateTime, default=datetime.utcnow)

    decks = relationship("Deck", back_populates="owner")
#Создаёт связь «один ко многим» (один пользователь → много колод).
#"Deck" — имя класса, с которым связываемся.
# back_populates="owner" — имя обратной связи в классе Deck.

class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True) #nullable - необязательное поле
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    owner = relationship("User", back_populates="decks")
    words = relationship("Word", back_populates="deck")


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    term = Column(String)  # Слово на английском
    definition = Column(String)  # Перевод
    example = Column(Text, nullable=True)  # Пример использования
    deck_id = Column(Integer, ForeignKey("decks.id"))

    #Поля для SRS (интервального повторения)
    next_review = Column(DateTime, default=datetime.utcnow)
    interval = Column(Integer, default=0)  # Интервал в днях
    ease_factor = Column(Integer, default=2500)  # Коэффициент лёгкости
    repetitions = Column(Integer, default=0)  # Количество повторений

    #Связь
    deck = relationship("Deck", back_populates="words")