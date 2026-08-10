from .auth import auth_bp
from .admin import admin_bp
from .staff import staff_bp
from .user import user_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(staff_bp)
    app.register_blueprint(user_bp)