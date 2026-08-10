from flask import Blueprint, jsonify, request, session
from sqlalchemy.orm import Session

from models.models import engine, User, StaffProfile

auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    with Session(engine) as db:

        user = db.query(User).filter(User.email == email).first()

        if user is None:
            return jsonify({
                "success": False,
                "message": "Invalid email"
            }), 401

        if not user.is_active:
            return jsonify({
                "success": False,
                "message": "Account not active"
            }), 403

        if not user.check_password(password):
            return jsonify({
                "success": False,
                "message": "Invalid password"
            }), 401

        session["userid"] = user.userid
        session["name"] = user.name
        session["role"] = user.role

        if user.role == "staff":

            staff = (
                db.query(StaffProfile)
                .filter(StaffProfile.userid == user.userid)
                .first()
            )

            if not staff:
                session.clear()
                return jsonify({
                    "success": False,
                    "message": "Staff profile not found"
                }), 404

            if staff.approval_status != "Approved":
                session.clear()
                return jsonify({
                    "success": False,
                    "message": "Your account is awaiting admin approval"
                }), 403

        return jsonify({
            "success": True,
            "message": "Login successful",
            "data": {
                "userid": user.userid,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        })


@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").lower().strip()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    role = data.get("role", "user")

    # if role == "admin":
    #     return jsonify({
    #         "success": False,
    #         "message": "Admin registration is not allowed"
    #     }), 403

    # if role not in ["user", "staff"]:
    #     role = "user"

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email, and password are required"
        }), 400

    if password != confirm_password:
        return jsonify({
            "success": False,
            "message": "Passwords do not match"
        }), 400

    with Session(engine) as db:

        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email already registered"
            }), 409

        new_user = User(
            name=name,
            email=email,
            role=role,
            phone=phone
        )

        new_user.set_password(password)

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        if role == "staff":

            staff = StaffProfile(userid=new_user.userid)

            db.add(staff)
            db.commit()

        return jsonify({
            "success": True,
            "message": "Registration successful",
            "data": {
                "userid": new_user.userid,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role
            }
        }), 201


@auth_bp.route("/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "success": True,
        "message": "Logged out successfully"
    })


@auth_bp.route("/me", methods=["GET"])
def current_user():

    if "userid" not in session:

        return jsonify({
            "success": False,
            "message": "Not authenticated"
        }), 401

    with Session(engine) as db:

        user = (
            db.query(User)
            .filter(User.userid == session["userid"])
            .first()
        )

        if not user:

            session.clear()

            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        return jsonify({
            "success": True,
            "data": {
                "userid": user.userid,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role
            }
        })