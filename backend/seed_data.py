from app.database import get_session, init_db
from app.models.user import User, UserRole
from app.core.security import hash_password
from sqlmodel import select

def seed():
    init_db()
    with next(get_session()) as session:
        # 1. Create Root Admin User
        admin = session.exec(select(User).where(User.username == "admin_boss")).first()
        if not admin:
            admin = User(
                username="admin_boss",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
            print(f"[OK] Created Admin: '{admin.username}' (ID: {admin.id})")
        else:
            print(f"[INFO] Admin '{admin.username}' already exists (ID: {admin.id})")

        # 2. Create Investigator 1
        inv1 = session.exec(select(User).where(User.username == "investigator_alpha")).first()
        if not inv1:
            inv1 = User(
                username="investigator_alpha",
                password_hash=hash_password("inv123"),
                role=UserRole.INVESTIGATOR,
                created_by_id=admin.id
            )
            session.add(inv1)
            session.commit()
            print(f"[OK] Created Investigator: '{inv1.username}' (Created by Admin ID: {admin.id})")
        else:
            print(f"[INFO] Investigator '{inv1.username}' already exists")

        # 3. Create Investigator 2
        inv2 = session.exec(select(User).where(User.username == "investigator_beta")).first()
        if not inv2:
            inv2 = User(
                username="investigator_beta",
                password_hash=hash_password("inv123"),
                role=UserRole.INVESTIGATOR,
                created_by_id=admin.id
            )
            session.add(inv2)
            session.commit()
            print(f"[OK] Created Investigator: '{inv2.username}' (Created by Admin ID: {admin.id})")
        else:
            print(f"[INFO] Investigator '{inv2.username}' already exists")

if __name__ == "__main__":
    seed()
