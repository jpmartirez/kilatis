from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.detection import router as detection_router

__all__ = ["auth_router", "users_router", "detection_router"]

