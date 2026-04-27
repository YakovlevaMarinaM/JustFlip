from sqlalchemy.orm import Session
from database import engine, Base
import models

def show_users():
    db = Session(bind=engine)
    try:
        users = db.query(models.User).all()
        print(f"\n=== ПОЛЬЗОВАТЕЛИ В БАЗЕ ===")
        print(f"Всего: {len(users)}\n")
        print(f"{'ID':<5} {'Username':<20} {'Email':<30}")
        print("-" * 60)
        for user in users:
            print(f"{user.id:<5} {user.username:<20} {user.email:<30}")
        print("=" * 60 + "\n")
    finally:
        db.close()

if __name__ == "__main__":
    show_users()

#cd justflip-backend
#python check_users.py