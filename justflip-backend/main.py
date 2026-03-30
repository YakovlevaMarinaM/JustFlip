
# main.py
'''
from sqlalchemy.orm import Session #Сеанс связи с БД (через него все: add(), commit(), query(), delete())
from datetime import datetime, timedelta, date
from database import engine, Base  # engine — это движок подключения к базе данных (содержит URL, драйвер, настройки).
                                   # Base — это базовый класс для моделей (от него наследуются все таблицы).

from fastapi import FastAPI, Depends, HTTPException, status #FastAPI — класс для создания самого приложения.
                                    # Depends — система внедрения зависимостей (например, сессия БД, текущий пользователь).
                                    # HTTPException — для выброса ошибок с кодами (400, 401, 404).
                                    # status — готовые коды HTTP-статусов (status.HTTP_400_BAD_REQUEST).

from fastapi.security import OAuth2PasswordRequestForm #Это стандартная форма OAuth2 с полями username и password.
                                                       # FastAPI сам создаст UI для ввода в документации /docs.
                               # Зачем: Чтобы указать, сколько времени будет действовать токен (например, 30 минут).
import models, database, schemas, auth # Импортирует локальные модули.
from datetime import datetime, timedelta, date

from sqlalchemy import cast
#from sqlite3 import Date

from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="JustFlip API", description="Веб-приложение для изучения иностранных слов JustFlip!")
#Создаёт экземпляр приложения FastAP. Это точка входа всего сервера. Все маршруты регистрируются через этот объект

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",  # ← Добавь эту строку!
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",  # ← И эту тоже!
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)









Base.metadata.create_all(bind=engine) #Создаёт все таблицы в базе данных.
# Берёт все классы из models.py, которые наследуются от Base.
# Преобразует их в SQL-команды CREATE TABLE.
# Выполняет в базе данных через engine.


@app.get("/") #Декоратор
async def root(): #«Обработчик» (Path Operation Function)
    return {"message": "Welcome to JustFlip!"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/register", response_model=schemas.UserResponse)
# response_model — схема ответа. FastAPI проверит, что возвращаемые данные соответствуют UserResponse
async def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
# user: schemas.UserCreate — данные из запроса. FastAPI автоматически валидирует JSON по этой схеме (проверит типы, обязательность полей).
# db: Session = Depends(database.get_db) — внедрение зависимости.
# Вызывается функция get_db() из database.py.
# Она создаёт и возвращает сессию БД.
# После завершения запроса сессия автоматически закроется.

    """Регистрация нового пользователя"""

    # Проверяем, существует ли пользователь
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) |
        (models.User.email == user.email)
    ).first()
# SQL аналог:
# SELECT * FROM users WHERE username = '...' OR email = '...' LIMIT 1;
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    # Создаём нового пользователя
    hashed_password = auth.get_password_hash(user.password) #Хэширует пароль.
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    ) # Пока это не записано в базу, просто объект Python.

    db.add(new_user) #Добавляет объект в сессию (помечает как "новый"), готовит данные к записи.
    db.commit() #Фиксирует изменения в базе данных.
    db.refresh(new_user) #Обновляет объект из базы.
# После commit() база присваивает пользователю id и другие авто-поля.
# refresh() загружает эти значения обратно в объект new_user, чтобы вернуть их клиенту.

    return new_user


@app.post("/api/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), #FastAPI автоматически примет данные формы (username, password)
                                                          # и положит их в form_data.
    db: Session = Depends(database.get_db)
):
    """Вход пользователя и получение токена"""
    user = auth.authenticate_user(db, form_data.username, form_data.password) #Проверяет логин/пароль

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}, # это сигнал для Swagger UI, что тут нужна OAuth2 авторизация.
                                                    # Благодаря этому в /docs появляется кнопка "Authorize".
        )

    # Создаём токен
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES) #Устанавливает время жизни токена
    access_token = auth.create_access_token(
        data={"sub": user.username}, # sub (subject) — стандартное поле для имени пользователя.
        expires_delta=access_token_expires # когда токен истечёт.
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/users/me", response_model=schemas.UserResponse) #Защищённый эндпоинт для получения данных о себе.
async def get_current_user(
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить данные текущего пользователя"""
    return current_user
# python -m uvicorn main:app
# uvicorn main:app --reload

@app.post("/api/decks", response_model=schemas.DeckResponse)
async def create_deck(
    deck: schemas.DeckCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Создать новую колоду"""
    new_deck = models.Deck(
        title=deck.title,
        description=deck.description,
        user_id=current_user.id
    )
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)
    return new_deck

@app.get("/api/decks", response_model=list[schemas.DeckResponse])
async def get_decks(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Получить все колоды пользователя"""
    decks = db.query(models.Deck).filter(
        models.Deck.user_id == current_user.id
    ).all()
    return decks

@app.get("/api/decks/{deck_id}", response_model=schemas.DeckResponse)
async def get_deck(
    deck_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Получить конкретную колоду по ID"""
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )
    return deck


@app.put("/api/decks/{deck_id}", response_model=schemas.DeckResponse)
async def update_deck(
    deck_id: int,
    deck: schemas.DeckCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Обновить колоду"""
    db_deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not db_deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    db_deck.title = deck.title
    db_deck.description = deck.description
    db.commit()
    db.refresh(db_deck)
    return db_deck


@app.delete("/api/decks/{deck_id}")
async def delete_deck(
    deck_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Удалить колоду"""
    db_deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not db_deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    db.delete(db_deck)
    db.commit()
    return {"message": "Deck deleted successfully"}

# python -m uvicorn main:app
# uvicorn main:app --reload


# === Эндпоинты для слов (Words) ===

@app.post("/api/words", response_model=schemas.WordResponse)
async def create_word(
    word: schemas.WordCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Добавить слово в колоду"""
    deck = db.query(models.Deck).filter(   # Проверяем, что колода существует и принадлежит пользователю
        models.Deck.id == word.deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    new_word = models.Word(     # Создаём новое слово
        term=word.term,
        definition=word.definition,
        example=word.example,
        deck_id=word.deck_id
    )
    db.add(new_word)
    db.commit()
    db.refresh(new_word)
    return new_word


@app.get("/api/words/{word_id}", response_model=schemas.WordResponse)
async def get_word(
        word_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить конкретное слово по ID"""
    word = db.query(models.Word).join(models.Deck).filter(
        models.Word.id == word_id,
        models.Deck.user_id == current_user.id
    ).first()
    #Видит метку ForeignKey("decks.id").
    # Автомически строит условие: ON words.deck_id = decks.id.

    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    return word


@app.put("/api/words/{word_id}", response_model=schemas.WordResponse)
async def update_word(
        word_id: int,
        word: schemas.WordCreate,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Обновить слово"""
    db_word = db.query(models.Word).join(models.Deck).filter(
        models.Word.id == word_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not db_word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    # Обновляем поля
    db_word.term = word.term
    db_word.definition = word.definition
    db_word.example = word.example
    # deck_id можно тоже обновить, но с проверкой:
    if word.deck_id != db_word.deck_id:
        new_deck = db.query(models.Deck).filter(
            models.Deck.id == word.deck_id,
            models.Deck.user_id == current_user.id
        ).first()
        if not new_deck:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target deck not found"
            )
        db_word.deck_id = word.deck_id

    db.commit()
    db.refresh(db_word)
    return db_word


@app.delete("/api/words/{word_id}")
async def delete_word(
        word_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Удалить слово"""
    db_word = db.query(models.Word).join(models.Deck).filter(
        models.Word.id == word_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not db_word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    db.delete(db_word)
    db.commit()
    return {"message": "Word deleted successfully"}


@app.get("/api/decks/{deck_id}/words", response_model=list[schemas.WordResponse])
async def get_deck_words(
        deck_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить все слова в конкретной колоде"""
    # Проверяем, что колода принадлежит пользователю
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    # Получаем все слова этой колоды
    words = db.query(models.Word).filter(
        models.Word.deck_id == deck_id
    ).all()

    return words







# === Эндпоинты для обучения (SRS) ===

from datetime import datetime, timedelta


@app.get("/api/study/next", response_model=schemas.WordResponse)
async def get_next_word(
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить следующее слово для повторения"""

    # Находим все колоды пользователя
    user_decks = db.query(models.Deck).filter(
        models.Deck.user_id == current_user.id
    ).all()

    if not user_decks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No decks found. Create a deck first!"
        )

    deck_ids = [deck.id for deck in user_decks]

    # Ищем слова, которые пора повторить (next_review <= сейчас)
    word = db.query(models.Word).filter(
        models.Word.deck_id.in_(deck_ids),
        models.Word.next_review <= datetime.utcnow()
    ).first()

    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No words to study right now!"
        )

    return word


@app.post("/api/study/result")
async def submit_study_result(
        word_id: int,
        difficulty: str,  # "easy", "medium", "hard"
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Отметить результат изучения слова"""
    today = datetime.utcnow()  # Сегодняшняя дата

    # Находим слово и проверяем, что оно принадлежит пользователю
    word = db.query(models.Word).join(models.Deck).filter(
        models.Word.id == word_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )


    if current_user.last_study_date is None:
        # Первый раз учится
        current_user.current_streak = 1
        current_user.longest_streak = 1
        current_user.last_study_date = today

    elif current_user.last_study_date == today:
        # Уже учился сегодня — серия не прерывается, но и не растёт
        pass  # Ничего не делаем

    elif current_user.last_study_date == today - timedelta(days=1):
        # Учился вчера —> серия продолжается
        current_user.current_streak += 1
        current_user.longest_streak = max(
            current_user.longest_streak,
            current_user.current_streak
        )
        current_user.last_study_date = today

    else:
        # Пропустил день или больше — серия прервалась
        current_user.current_streak = 1
        current_user.last_study_date = today

    db.commit()  # Сохраняем изменения в User

    # === АЛГОРИТМ SRS ===
    if difficulty == "easy":
        # Увеличиваем интервал
        if word.repetitions == 0:
            word.interval = 1
        elif word.repetitions == 1:
            word.interval = 3
        else:
            word.interval = int(word.interval * word.ease_factor / 1000)

        word.repetitions += 1
        word.ease_factor = min(3000, word.ease_factor + 150)

    elif difficulty == "medium":
        # Средний интервал
        if word.repetitions == 0:
            word.interval = 1
        else:
            word.interval = int(word.interval * word.ease_factor / 1000)

        word.repetitions += 1
        # ease_factor не меняем

    elif difficulty == "hard":
        # Сбрасываем прогресс
        word.interval = 1
        word.repetitions = 0
        word.ease_factor = max(1300, word.ease_factor - 200)

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Difficulty must be 'easy', 'medium', or 'hard'"
        )

    # Вычисляем дату следующего повторения
    word.next_review = datetime.utcnow() + timedelta(days=word.interval)

    db.commit()
    db.refresh(word)

    return {
        "message": "Study result saved",
        "word_id": word.id,
        "next_review": word.next_review,
        "interval": word.interval,
        "repetitions": word.repetitions
    }


# === Эндпоинт для статистики ===

@app.get("/api/study/stats", response_model=schemas.StudyStats)
async def get_detailed_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Статистика для страницы 'Прогресс'"""
    from sqlalchemy import func

    # Находим все колоды пользователя
    deck_ids = [d.id for d in db.query(models.Deck).filter(
        models.Deck.user_id == current_user.id
    ).all()]

    # Если колод нет — возвращаем пустую статистику
    if not deck_ids:
        return schemas.StudyStats(
            due_now=0,
            mastered=0,
            total=0,
            progress_percent=0,
            hardest_words=[],
            longest_streak=0,
            current_streak=0
        )

    # === Основные подсчёты ===
    total = db.query(models.Word).filter(
        models.Word.deck_id.in_(deck_ids)
    ).count()

    due_now = db.query(models.Word).filter(
        models.Word.deck_id.in_(deck_ids),
        models.Word.next_review <= datetime.utcnow()
    ).count()

    mastered = db.query(models.Word).filter(
        models.Word.deck_id.in_(deck_ids),
        models.Word.repetitions >= 5
    ).count()

    progress_percent = round(mastered / total * 100) if total > 0 else 0

    # Активность за последние 7 дней
    #week_ago = datetime.utcnow().date() - timedelta(days=7)

    # Группируем по датам, когда слова были повторены
    #history = db.query(
    #    cast(models.Word.next_review, Date).label('date'),
    #    func.count().label('count')
    #).filter(
    #    models.Word.deck_id.in_(deck_ids),
    #    models.Word.next_review >= week_ago
    #).group_by(
    #    cast(models.Word.next_review, Date)
    #).all()

    # Преобразуем в формат для графика для фронтэнда
   # weekly_activity = [
    #   {"date": str(h.date), "words_studied": h.count}
     #  for h in history
    #  ]

    #Самые сложные слова
    hardest_words_query = db.query(
        models.Word.term,
        models.Word.ease_factor,
        models.Word.repetitions
    ).filter(
        models.Word.deck_id.in_(deck_ids),
        models.Word.ease_factor < 2000
    ).order_by(models.Word.ease_factor.asc()).limit(5).all()

    hardest_words = [
        {
            "term": w.term,
            "ease_factor": round(w.ease_factor / 1000, 2),
            "repetitions": w.repetitions
        }
        for w in hardest_words_query
    ]

# === Возвращаем  поля из схемы ===
    return schemas.StudyStats(
        due_now=due_now,
        mastered=mastered,
        total=total,
        progress_percent=progress_percent,
        # weekly_activity =
        hardest_words=hardest_words,
        longest_streak=current_user.longest_streak,
        current_streak=current_user.current_streak
    )

# python -m uvicorn main:app  <-- это в первый терминал (зелененький сайт, документация)
# uvicorn main:app --reload


# cd justflip-frontend
# npm run dev <-- это во второй терминал (сам сайт, фиолетовый)
# python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
'''
# main.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from database import engine, Base
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
import models, database, schemas, auth
from sqlalchemy import cast
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="JustFlip API", description="Веб-приложение для изучения иностранных слов JustFlip!")

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаёт все таблицы в базе данных
Base.metadata.create_all(bind=engine)


@app.get("/")
async def root():
    return {"message": "Welcome to JustFlip!"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Регистрация нового пользователя"""
    db_user = db.query(models.User).filter(
        (models.User.username == user.username) |
        (models.User.email == user.email)
    ).first()

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/api/login")
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(database.get_db)
):
    """Вход пользователя и получение токена"""
    user = auth.authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/users/me", response_model=schemas.UserResponse)
async def get_current_user(
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить данные текущего пользователя"""
    return current_user


@app.post("/api/decks", response_model=schemas.DeckResponse)
async def create_deck(
        deck: schemas.DeckCreate,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Создать новую колоду"""
    new_deck = models.Deck(
        title=deck.title,
        description=deck.description,
        user_id=current_user.id
    )
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)
    return new_deck


@app.get("/api/decks", response_model=list[schemas.DeckResponse])
async def get_decks(
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить все колоды пользователя"""
    decks = db.query(models.Deck).filter(
        models.Deck.user_id == current_user.id
    ).all()
    return decks


@app.get("/api/decks/{deck_id}", response_model=schemas.DeckResponse)
async def get_deck(
        deck_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить конкретную колоду по ID"""
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )
    return deck


@app.put("/api/decks/{deck_id}", response_model=schemas.DeckResponse)
async def update_deck(
        deck_id: int,
        deck: schemas.DeckCreate,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Обновить колоду"""
    db_deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not db_deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    db_deck.title = deck.title
    db_deck.description = deck.description
    db.commit()
    db.refresh(db_deck)
    return db_deck


@app.delete("/api/decks/{deck_id}")
async def delete_deck(
        deck_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Удалить колоду"""
    db_deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not db_deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    db.delete(db_deck)
    db.commit()
    return {"message": "Deck deleted successfully"}


# === Эндпоинты для слов (Words) ===

@app.post("/api/words", response_model=schemas.WordResponse)
async def create_word(
        word: schemas.WordCreate,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Добавить слово в колоду"""
    deck = db.query(models.Deck).filter(
        models.Deck.id == word.deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    new_word = models.Word(
        term=word.term,
        definition=word.definition,
        example=word.example,
        deck_id=word.deck_id
    )
    db.add(new_word)
    db.commit()
    db.refresh(new_word)
    return new_word


@app.get("/api/words/{word_id}", response_model=schemas.WordResponse)
async def get_word(
        word_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить конкретное слово по ID"""
    word = db.query(models.Word).join(models.Deck).filter(
        models.Word.id == word_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    return word


@app.put("/api/words/{word_id}", response_model=schemas.WordResponse)
async def update_word(
        word_id: int,
        word: schemas.WordCreate,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Обновить слово"""
    db_word = db.query(models.Word).join(models.Deck).filter(
        models.Word.id == word_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not db_word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    db_word.term = word.term
    db_word.definition = word.definition
    db_word.example = word.example

    if word.deck_id != db_word.deck_id:
        new_deck = db.query(models.Deck).filter(
            models.Deck.id == word.deck_id,
            models.Deck.user_id == current_user.id
        ).first()
        if not new_deck:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target deck not found"
            )
        db_word.deck_id = word.deck_id

    db.commit()
    db.refresh(db_word)
    return db_word


@app.delete("/api/words/{word_id}")
async def delete_word(
        word_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Удалить слово"""
    db_word = db.query(models.Word).join(models.Deck).filter(
        models.Word.id == word_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not db_word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    db.delete(db_word)
    db.commit()
    return {"message": "Word deleted successfully"}


@app.get("/api/decks/{deck_id}/words", response_model=list[schemas.WordResponse])
async def get_deck_words(
        deck_id: int,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить все слова в конкретной колоде"""
    deck = db.query(models.Deck).filter(
        models.Deck.id == deck_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )

    words = db.query(models.Word).filter(
        models.Word.deck_id == deck_id
    ).all()

    return words


# === Эндпоинты для обучения (SRS) ===

@app.get("/api/study/next", response_model=schemas.WordResponse)
async def get_next_word(
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Получить следующее слово для повторения"""
    user_decks = db.query(models.Deck).filter(
        models.Deck.user_id == current_user.id
    ).all()

    if not user_decks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No decks found. Create a deck first!"
        )

    deck_ids = [deck.id for deck in user_decks]

    word = db.query(models.Word).filter(
        models.Word.deck_id.in_(deck_ids),
        models.Word.next_review <= datetime.utcnow()
    ).first()

    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No words to study right now!"
        )

    return word


@app.post("/api/study/result")
async def submit_study_result(
        word_id: int,
        difficulty: str,
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Отметить результат изучения слова"""
    today = datetime.utcnow()

    word = db.query(models.Word).join(models.Deck).filter(
        models.Word.id == word_id,
        models.Deck.user_id == current_user.id
    ).first()

    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found"
        )

    if current_user.last_study_date is None:
        current_user.current_streak = 1
        current_user.longest_streak = 1
        current_user.last_study_date = today
    elif current_user.last_study_date == today:
        pass
    elif current_user.last_study_date == today - timedelta(days=1):
        current_user.current_streak += 1
        current_user.longest_streak = max(
            current_user.longest_streak,
            current_user.current_streak
        )
        current_user.last_study_date = today
    else:
        current_user.current_streak = 1
        current_user.last_study_date = today

    db.commit()

    # === АЛГОРИТМ SRS ===
    if difficulty == "easy":
        if word.repetitions == 0:
            word.interval = 1
        elif word.repetitions == 1:
            word.interval = 3
        else:
            word.interval = int(word.interval * word.ease_factor / 1000)
        word.repetitions += 1
        word.ease_factor = min(3000, word.ease_factor + 150)
    elif difficulty == "medium":
        if word.repetitions == 0:
            word.interval = 1
        else:
            word.interval = int(word.interval * word.ease_factor / 1000)
        word.repetitions += 1
    elif difficulty == "hard":
        word.interval = 1
        word.repetitions = 0
        word.ease_factor = max(1300, word.ease_factor - 200)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Difficulty must be 'easy', 'medium', or 'hard'"
        )

    word.next_review = datetime.utcnow() + timedelta(days=word.interval)

    db.commit()
    db.refresh(word)

    return {
        "message": "Study result saved",
        "word_id": word.id,
        "next_review": word.next_review,
        "interval": word.interval,
        "repetitions": word.repetitions
    }


# === Эндпоинт для статистики ===

@app.get("/api/study/stats", response_model=schemas.StudyStats)
async def get_detailed_stats(
        db: Session = Depends(database.get_db),
        current_user: models.User = Depends(auth.get_current_user)
):
    """Статистика для страницы 'Прогресс'"""
    from sqlalchemy import func

    deck_ids = [d.id for d in db.query(models.Deck).filter(
        models.Deck.user_id == current_user.id
    ).all()]

    if not deck_ids:
        return schemas.StudyStats(
            due_now=0,
            mastered=0,
            total=0,
            progress_percent=0,
            hardest_words=[],
            longest_streak=0,
            current_streak=0
        )

    total = db.query(models.Word).filter(
        models.Word.deck_id.in_(deck_ids)
    ).count()

    due_now = db.query(models.Word).filter(
        models.Word.deck_id.in_(deck_ids),
        models.Word.next_review <= datetime.utcnow()
    ).count()

    mastered = db.query(models.Word).filter(
        models.Word.deck_id.in_(deck_ids),
        models.Word.repetitions >= 5
    ).count()

    progress_percent = round(mastered / total * 100) if total > 0 else 0

    hardest_words_query = db.query(
        models.Word.term,
        models.Word.ease_factor,
        models.Word.repetitions
    ).filter(
        models.Word.deck_id.in_(deck_ids),
        models.Word.ease_factor < 2000
    ).order_by(models.Word.ease_factor.asc()).limit(5).all()

    hardest_words = [
        {
            "term": w.term,
            "ease_factor": round(w.ease_factor / 1000, 2),
            "repetitions": w.repetitions
        }
        for w in hardest_words_query
    ]

    return schemas.StudyStats(
        due_now=due_now,
        mastered=mastered,
        total=total,
        progress_percent=progress_percent,
        hardest_words=hardest_words,
        longest_streak=current_user.longest_streak,
        current_streak=current_user.current_streak
    )