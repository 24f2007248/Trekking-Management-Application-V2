from flask import Blueprint, jsonify, request, session
from sqlalchemy.orm import Session
from datetime import datetime
from redis_client import get_cache, set_cache, clear_trek_cache

from models.models import engine, User, StaffProfile, Trek, Booking

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)

def admin_required():
    if "role" not in session or session["role"] != "admin":
        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    return None

@admin_bp.route("/dashboard", methods=["GET"])
def admin_dashboard():
    auth = admin_required()
    if auth:
        return auth

    with Session(engine) as db:

        total_treks = db.query(Trek).count()
        total_users = db.query(User).filter(User.role == "user").count()
        total_staff = db.query(StaffProfile).count()
        total_bookings = db.query(Booking).count()

        recent_bookings = (
            db.query(Booking)
            .join(User, Booking.userid == User.userid)
            .join(Trek, Booking.trekid == Trek.trekid)
            .order_by(Booking.booking_date.desc())
            .limit(5)
            .all()
        )

        booking_list = []

        for booking in recent_bookings:

            booking_list.append({

                "booking_id": booking.bookingid,
                "user_name": booking.user.name,
                "trek_name": booking.trek.trekname,
                "booking_date": booking.booking_date.strftime("%d %b %Y")
                if booking.booking_date else None,
                "status": booking.booking_status
            })

        return jsonify({

            "success": True,
            "data": {

                "stats": {
                    "total_treks": total_treks,
                    "total_users": total_users,
                    "total_staff": total_staff,
                    "total_bookings": total_bookings
                },

                "recent_bookings": booking_list
            }
        })


@admin_bp.route("/treks", methods=["GET"])
def admin_treks():

    auth = admin_required()
    if auth:
        return auth

    search_query = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "All").strip()

    try:
        page = int(request.args.get("page", 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1

    PER_PAGE = 5

    cache_key = (
        f"treks:admin:"
        f"page={page}:"
        f"search={search_query}:"
        f"status={status_filter}"
    )

    cached_data = get_cache(cache_key)

    if cached_data:
        return jsonify(cached_data)

    with Session(engine) as db:

        query = db.query(Trek)

        if search_query:
            query = query.filter(
                Trek.trekname.ilike(f"%{search_query}%") |
                Trek.location.ilike(f"%{search_query}%")
            )

        if status_filter != "All":
            query = query.filter(
                Trek.status == status_filter
            )

        total_items = query.count()

        total_pages = (
            (total_items + PER_PAGE - 1) // PER_PAGE
            if total_items else 1
        )

        if page > total_pages:
            page = total_pages

        offset = (page - 1) * PER_PAGE

        treks = (
            query
            .order_by(Trek.trekid.desc())
            .offset(offset)
            .limit(PER_PAGE)
            .all()
        )

        trek_list = []

        for trek in treks:

            trek_list.append({

                "id": trek.trekid,
                "raw_id": trek.trekid,

                "name": trek.trekname,
                "location": trek.location,
                "difficulty": trek.difficulty,

                "slots": trek.available_slots,

                "status": trek.status,

                "assigned_staff": trek.assigned_staff,

                "start_date": (
                    trek.start_date.isoformat()
                    if trek.start_date else None
                ),

                "end_date": (
                    trek.end_date.isoformat()
                    if trek.end_date else None
                )
            })

        response_data = {

            "success": True,

            "data": {

                "treks": trek_list,

                "pagination": {

                    "page": page,
                    "per_page": PER_PAGE,
                    "total_items": total_items,
                    "total_pages": total_pages
                },

                "filters": {

                    "search": search_query,
                    "status": status_filter
                }
            }
        }

        set_cache(cache_key, response_data)

        return jsonify(response_data)
    

@admin_bp.route("/staff", methods=["GET"])
def admin_staff():
    auth = admin_required()
    if auth:
        return auth

    active_tab = request.args.get("tab", "pending")

    with Session(engine) as db:
        counts = {
            "pending": db.query(StaffProfile).filter_by(approval_status="Pending").count(),
            "approved": db.query(StaffProfile).filter_by(approval_status="Approved").count(),
            "blacklisted": db.query(StaffProfile).filter_by(approval_status="Blacklisted").count(),
        }

        profiles = (
            db.query(StaffProfile)
            .join(User, StaffProfile.userid == User.userid)
            .filter(StaffProfile.approval_status == active_tab.capitalize())
            .all()
        )

        staff_members = []
        for profile in profiles:
            staff_members.append({
                "id": profile.staffid,
                "raw_id": profile.staffid,
                "name": profile.user.name,
                "email": profile.user.email,
                "contact": profile.user.phone,
                "status": profile.approval_status
            })

        return jsonify({
            "success": True,
            "data": {
                "active_tab": active_tab,
                "counts": counts,
                "staff_members": staff_members
            }
        })


@admin_bp.route("/staff/<int:staff_id>/<action>", methods=["POST"])
def update_staff_status(staff_id, action):
    auth = admin_required()
    if auth:
        return auth

    with Session(engine) as db:
        profile = db.get(StaffProfile, staff_id)

        if not profile:
            return jsonify({
                "success": False,
                "message": "Staff profile not found"
            }), 404

        action = action.lower()

        if action == "approve":
            profile.approval_status = "Approved"

        elif action == "reject":
            db.delete(profile)

        elif action == "blacklist":
            profile.approval_status = "Blacklisted"

        elif action == "restore":
            profile.approval_status = "Approved"

        else:
            return jsonify({
                "success": False,
                "message": "Invalid action"
            }), 400

        db.commit()
        clear_trek_cache()

        return jsonify({
            "success": True,
            "message": "Staff status updated"
        })


@admin_bp.route("/users", methods=["GET"])
def admin_users():

    auth = admin_required()
    if auth:
        return auth

    search_query = request.args.get("search", "").strip()

    try:
        page = int(request.args.get("page", 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1

    PER_PAGE = 5

    with Session(engine) as db:

        query = db.query(User).filter(User.role == "user")

        if search_query:
            query = query.filter(
                (User.name.ilike(f"%{search_query}%")) |
                (User.email.ilike(f"%{search_query}%"))
            )

        total_items = query.count()

        total_pages = (
            (total_items + PER_PAGE - 1) // PER_PAGE
            if total_items else 1
        )

        if page > total_pages:
            page = total_pages

        users = (
            query.order_by(User.userid.desc())
            .offset((page - 1) * PER_PAGE)
            .limit(PER_PAGE)
            .all()
        )

        users_list = []

        for user in users:

            users_list.append({
                "id": user.userid,
                "raw_id": user.userid,
                "name": user.name,
                "email": user.email,
                "contact": user.phone,
                "status": "Active" if user.is_active else "Inactive",
                "is_active": user.is_active
            })

        return jsonify({
            "success": True,
            "data": {
                "users": users_list,
                "pagination": {
                    "page": page,
                    "per_page": PER_PAGE,
                    "total_items": total_items,
                    "total_pages": total_pages
                },
                "filters": {
                    "search": search_query
                }
            }
        })


@admin_bp.route("/users/<int:user_id>/toggle", methods=["POST"])
def toggle_user_status(user_id):
    auth = admin_required()
    if auth:
        return auth

    with Session(engine) as db:
        user = db.get(User, user_id)

        if not user or user.role != "user":
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        user.is_active = not user.is_active
        db.commit()
        clear_trek_cache()

        return jsonify({
            "success": True,
            "message": "User status updated"
        })


@admin_bp.route("/bookings", methods=["GET"])
def admin_bookings():

    auth = admin_required()
    if auth:
        return auth

    search_query = request.args.get("search", "").strip()

    try:
        page = int(request.args.get("page", 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1

    PER_PAGE = 5

    with Session(engine) as db:

        query = (
            db.query(Booking)
            .join(User, Booking.userid == User.userid)
            .join(Trek, Booking.trekid == Trek.trekid)
        )

        if search_query:
            query = query.filter(
                (User.name.ilike(f"%{search_query}%")) |
                (Trek.trekname.ilike(f"%{search_query}%"))
            )

        total_items = query.count()

        total_pages = (
            (total_items + PER_PAGE - 1) // PER_PAGE
            if total_items else 1
        )

        if page > total_pages:
            page = total_pages

        bookings = (
            query.order_by(Booking.booking_date.desc())
            .offset((page - 1) * PER_PAGE)
            .limit(PER_PAGE)
            .all()
        )

        bookings_list = []

        for booking in bookings:

            bookings_list.append({
                "id": booking.bookingid,
                "user_name": booking.user.name,
                "trek_title": booking.trek.trekname,
                "booking_date": (
                    booking.booking_date.strftime("%d %b %Y")
                    if booking.booking_date else None
                ),
                "status": booking.booking_status
            })

        return jsonify({
            "success": True,
            "data": {
                "bookings": bookings_list,
                "pagination": {
                    "page": page,
                    "per_page": PER_PAGE,
                    "total_items": total_items,
                    "total_pages": total_pages
                },
                "filters": {
                    "search": search_query
                }
            }
        })


@admin_bp.route("/treks/<int:trek_id>", methods=["GET"])
def get_trek(trek_id):
    auth = admin_required()
    if auth:
        return auth

    with Session(engine) as db:
        trek = db.get(Trek, trek_id)

        if not trek:
            return jsonify({
                "success": False,
                "message": "Trek not found"
            }), 404

        return jsonify({
            "success": True,
            "data": {
                "trek": {
                    "trekid": trek.trekid,
                    "trekname": trek.trekname,
                    "location": trek.location,
                    "difficulty": trek.difficulty,
                    "duration": trek.duration,
                    "description": trek.description,
                    "total_slots": trek.total_slots,
                    "available_slots": trek.available_slots,
                    "assigned_staff": trek.assigned_staff,
                    "status": trek.status,
                    "start_date": trek.start_date.isoformat(),
                    "end_date": trek.end_date.isoformat()
                }
            }
        })


@admin_bp.route("/treks", methods=["POST"])
def add_trek():
    auth = admin_required()
    if auth:
        return auth

    data = request.get_json()

    with Session(engine) as db:
        trek = Trek(
            trekname=data["trekname"],
            location=data["location"],
            difficulty=data["difficulty"],
            duration=int(data["duration"]),
            description=data.get("description", ""),
            total_slots=int(data["slots"]),
            available_slots=int(data["slots"]),
            assigned_staff=int(data["staff_id"]),
            status=data["status"],
            start_date=datetime.strptime(data["start_date"], "%Y-%m-%d").date(),
            end_date=datetime.strptime(data["end_date"], "%Y-%m-%d").date(),
        )

        db.add(trek)
        db.commit()
        clear_trek_cache()

        return jsonify({
            "success": True,
            "message": "Trek created"
        }), 201


@admin_bp.route("/treks/<int:trek_id>", methods=["PUT"])
def edit_trek(trek_id):
    auth = admin_required()
    if auth:
        return auth

    data = request.get_json()

    with Session(engine) as db:
        trek = db.get(Trek, trek_id)

        if not trek:
            return jsonify({
                "success": False,
                "message": "Trek not found"
            }), 404

        trek.trekname = data["trekname"]
        trek.location = data["location"]
        trek.difficulty = data["difficulty"]
        trek.description = data.get("description", "")

        start_date = datetime.strptime(
            data["start_date"], "%Y-%m-%d"
        ).date()

        end_date = datetime.strptime(
            data["end_date"], "%Y-%m-%d"
        ).date()

        if end_date < start_date:
            return jsonify({
                "success": False,
                "message": "End date cannot be before start date"
            }), 400

        duration = (end_date - start_date).days + 1

        trek.start_date = start_date
        trek.end_date = end_date
        trek.duration = duration

        new_total_slots = int(data["slots"])

        booked_participants = trek.total_slots - trek.available_slots

        if new_total_slots < booked_participants:
            return jsonify({
                "success": False,
                "message": (
                    f"Cannot reduce total slots below the number of booked "
                    f"participants ({booked_participants})"
                )
            }), 400

        slot_difference = new_total_slots - trek.total_slots

        trek.total_slots = new_total_slots
        trek.available_slots += slot_difference

        if trek.available_slots < 0:
            trek.available_slots = 0

        if trek.available_slots > trek.total_slots:
            trek.available_slots = trek.total_slots

        trek.assigned_staff = int(data["staff_id"])
        trek.status = data["status"]

        db.commit()
        clear_trek_cache()

        return jsonify({
            "success": True,
            "message": "Trek updated"
        })
    
@admin_bp.route("/treks/<int:trek_id>", methods=["DELETE"])
def delete_trek(trek_id):
    auth = admin_required()
    if auth:
        return auth

    with Session(engine) as db:
        trek = db.get(Trek, trek_id)

        if not trek:
            return jsonify({
                "success": False,
                "message": "Trek not found"
            }), 404

        db.delete(trek)
        db.commit()
        clear_trek_cache()

        return jsonify({
            "success": True,
            "message": "Trek deleted"
        })

@admin_bp.route("/staff-list", methods=["GET"])
def approved_staff_list():
    auth = admin_required()
    if auth:
        return auth

    with Session(engine) as db:
        staff = (
            db.query(StaffProfile)
            .join(User)
            .filter(StaffProfile.approval_status == "Approved")
            .all()
        )

        staff_list = []
        for s in staff:
            staff_list.append({
                "id": s.user.userid,
                "name": s.user.name
            })

        return jsonify({
            "success": True,
            "data": {
                "staff": staff_list
            }
        })