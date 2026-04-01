#schemas.py - Pydantic-схемы для валидации данных (UserCreate, UserResponse).

from pydantic import BaseModel, EmailStr #BaseModel - Базовый класс для всех схем, EmailStr - Специальный тип для email
from datetime import datetime #Импортирует класс для работы с датой и временем
from typing import Optional, List #Импортирует тип Optional из модуля типизации.
                            #Указать, что параметр может быть значением или None. Про List уточнить



class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config: #Разрешает Pydantic преобразовывать ORM-объекты (из SQLAlchemy) в схемы
        from_attributes = True


#      Для колод
class DeckCreate(BaseModel):
    title: str
    description: Optional[str] = None


class DeckResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    user_id: int

    class Config:
        from_attributes = True


#       Для слов
class WordCreate(BaseModel):
    term: str
    definition: str
    example: Optional[str] = None
    deck_id: int

    #Поля SRS опциональны при создании (установятся дефолтные значения)
    next_review: Optional[datetime] = None
    interval: Optional[int] = 0
    ease_factor: Optional[int] = 2500
    repetitions: Optional[int] = 0


class WordResponse(BaseModel):
    id: int
    term: str
    definition: str
    example: Optional[str]
    deck_id: int

    #Поля SRS для ответа
    next_review: datetime
    interval: int
    ease_factor: int
    repetitions: int

    class Config:
        from_attributes = True



class StudyStats(BaseModel):
    due_now: int
    mastered: int
    total: int
    progress_percent: int
    #weekly_activity: List[dict]
    hardest_words: List[dict]
    longest_streak: int
    current_streak: int

    class Config:
        from_attributes = True