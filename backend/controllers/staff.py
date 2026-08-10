from flask import Blueprint, jsonify, request, session
from sqlalchemy.orm import Session

from models.models import engine, User, StaffProfile, Trek, Booking

staff_bp = Blueprint(
    "staff",
    __name__,
    url_prefix="/api/staff"
)


def staff_required():
    if "role" not in session or session["role"] != "staff":
        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    return None


@staff_bp.route("/dashboard", methods=["GET"])
def staff_dashboard():

    auth = staff_required()
    if auth:
        return auth

    user_id = session.get("userid")

    with Session(engine) as db:

        staff_profile = (
            db.query(StaffProfile)
            .filter(StaffProfile.userid == user_id)
            .first()
        )

        if not staff_profile:
            return jsonify({
                "success": False,
                "message": "Staff profile not found"
            }), 404

        assigned_treks = (
            db.query(Trek)
            .filter(Trek.assigned_staff == staff_profile.userid)
            .all()
        )

        total_assigned = len(assigned_treks)

        open_treks_count = sum(
            1
            for trek in assigned_treks
            if trek.status and trek.status.lower() == "open"
        )

        total_participants = 0
        assigned_trek_list = []

        for trek in assigned_treks:

            participant_count = (
                db.query(Booking)
                .filter(
                    Booking.trekid == trek.trekid,
                    Booking.booking_status == "Booked"
                )
                .count()
            )

            total_participants += participant_count

            if trek.status == "Open":

                assigned_trek_list.append({
                    "id": trek.trekid,
                    "raw_id": trek.trekid,
                    "name": trek.trekname,
                    "location": trek.location,
                    "participants": participant_count,
                    "slots": f"{trek.available_slots}/{trek.total_slots}",
                    "status": trek.status
                })

        return jsonify({
            "success": True,
            "data": {
                "stats": {
                    "assigned_treks": total_assigned,
                    "open_treks": open_treks_count,
                    "total_participants": total_participants
                },
                "assigned_treks": assigned_trek_list
            }
        })

@staff_bp.route("/treks", methods=["GET"])
def staff_treks():

    auth = staff_required()
    if auth:
        return auth

    try:
        page = int(request.args.get("page", 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1

    search_query = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "All")

    PER_PAGE = 5

    with Session(engine) as db:

        staff_profile = (
            db.query(StaffProfile)
            .filter(StaffProfile.userid == session["userid"])
            .first()
        )

        if not staff_profile:
            return jsonify({
                "success": False,
                "message": "Staff profile not found"
            }), 404

        query = db.query(Trek).filter(
            Trek.assigned_staff == staff_profile.userid
        )

        if status_filter != "All":
            query = query.filter(Trek.status == status_filter)

        if search_query:
            query = query.filter(
                (Trek.trekname.ilike(f"%{search_query}%")) |
                (Trek.location.ilike(f"%{search_query}%"))
            )

        total_items = query.count()

        total_pages = (
            (total_items + PER_PAGE - 1) // PER_PAGE
            if total_items else 1
        )

        if page > total_pages:
            page = total_pages

        offset = (page - 1) * PER_PAGE

        my_treks = (
            query.order_by(Trek.start_date.asc())
            .offset(offset)
            .limit(PER_PAGE)
            .all()
        )

        trek_list = []

        for trek in my_treks:

            trek_list.append({
                "id": trek.trekid,
                "raw_id": trek.trekid,
                "name": trek.trekname,
                "location": trek.location,
                "difficulty": trek.difficulty,
                "slots": f"{trek.available_slots}/{trek.total_slots}",
                "status": trek.status
            })

        return jsonify({
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
        })

@staff_bp.route("/treks/<int:trek_id>", methods=["GET"])
def staff_manage_trek(trek_id):

    auth = staff_required()
    if auth:
        return auth

    with Session(engine) as db:

        staff_profile = (
            db.query(StaffProfile)
            .filter(StaffProfile.userid == session["userid"])
            .first()
        )

        if not staff_profile:
            return jsonify({
                "success": False,
                "message": "Staff profile not found"
            }), 404

        trek = (
            db.query(Trek)
            .filter(Trek.trekid == trek_id)
            .first()
        )

        if not trek:
            return jsonify({
                "success": False,
                "message": "Trek not found"
            }), 404

        # Ensure only assigned staff can manage this trek
        if trek.assigned_staff != staff_profile.userid:
            return jsonify({
                "success": False,
                "message": "You are not assigned to this trek"
            }), 403

        active_bookings = (
            db.query(Booking)
            .filter(Booking.trekid == trek_id)
            .all()
        )

        participants = []

        for booking in active_bookings:

            participants.append({
                "bookingid": booking.bookingid,
                "userid": booking.userid,
                "user_name": booking.user.name,
                "email": booking.user.email,
                "phone": booking.user.phone,
                "booking_date": (
                    booking.booking_date.strftime("%d %b %Y")
                    if booking.booking_date else None
                ),
                "status": booking.booking_status
            })

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
                    "status": trek.status,
                    "start_date": (
                        trek.start_date.isoformat()
                        if trek.start_date else None
                    ),
                    "end_date": (
                        trek.end_date.isoformat()
                        if trek.end_date else None
                    )
                },
                "participants": participants
            }
        })

@staff_bp.route("/treks/<int:trek_id>", methods=["PUT"])
def staff_update_trek_config(trek_id):

    auth = staff_required()
    if auth:
        return auth

    data = request.get_json()

    with Session(engine) as db:

        staff_profile = (
            db.query(StaffProfile)
            .filter(StaffProfile.userid == session["userid"])
            .first()
        )

        if not staff_profile:
            return jsonify({
                "success": False,
                "message": "Staff profile not found"
            }), 404

        trek = (
            db.query(Trek)
            .filter(Trek.trekid == trek_id)
            .first()
        )

        if not trek:
            return jsonify({
                "success": False,
                "message": "Trek not found"
            }), 404

        if trek.assigned_staff != staff_profile.userid:
            return jsonify({
                "success": False,
                "message": "You are not assigned to this trek"
            }), 403

        if "available_slots" in data:
            trek.available_slots = int(data["available_slots"])

        if "status" in data:
            trek.status = data["status"]

        db.commit()

        return jsonify({
            "success": True,
            "message": "Trek configuration updated successfully"
        })


@staff_bp.route("/treks/<int:trek_id>/status", methods=["PATCH"])
def staff_change_status(trek_id):

    auth = staff_required()
    if auth:
        return auth

    data = request.get_json()

    next_state = data.get("status")

    if next_state not in ["Started", "Completed"]:
        return jsonify({
            "success": False,
            "message": "Invalid status transition"
        }), 400

    with Session(engine) as db:

        staff_profile = (
            db.query(StaffProfile)
            .filter(StaffProfile.userid == session["userid"])
            .first()
        )

        if not staff_profile:
            return jsonify({
                "success": False,
                "message": "Staff profile not found"
            }), 404

        trek = (
            db.query(Trek)
            .filter(Trek.trekid == trek_id)
            .first()
        )

        if not trek:
            return jsonify({
                "success": False,
                "message": "Trek not found"
            }), 404

        if trek.assigned_staff != staff_profile.userid:
            return jsonify({
                "success": False,
                "message": "You are not assigned to this trek"
            }), 403

        trek.status = next_state

        db.commit()

        return jsonify({
            "success": True,
            "message": f"Trek marked as {next_state}"
        })


@staff_bp.route("/participants", methods=["GET"])
def staff_participants():

    auth = staff_required()
    if auth:
        return auth

    search_query = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "All")
    trek_filter = request.args.get("trek", "All")

    with Session(engine) as db:

        staff_profile = (
            db.query(StaffProfile)
            .filter(StaffProfile.userid == session["userid"])
            .first()
        )

        if not staff_profile:
            return jsonify({
                "success": False,
                "message": "Staff profile not found"
            }), 404

        trek_list = (
            db.query(Trek)
            .filter(Trek.assigned_staff == staff_profile.userid)
            .order_by(Trek.trekname)
            .all()
        )

        bookings_query = (
            db.query(Booking)
            .join(Trek, Booking.trekid == Trek.trekid)
            .join(User, Booking.userid == User.userid)
            .filter(Trek.assigned_staff == staff_profile.userid)
        )

        if search_query:
            bookings_query = bookings_query.filter(
                User.name.ilike(f"%{search_query}%") |
                User.email.ilike(f"%{search_query}%") |
                Trek.trekname.ilike(f"%{search_query}%")
            )

        if status_filter != "All":
            bookings_query = bookings_query.filter(
                Booking.booking_status == status_filter
            )

        if trek_filter != "All":
            bookings_query = bookings_query.filter(
                Booking.trekid == int(trek_filter)
            )

        bookings = (
            bookings_query
            .order_by(Booking.booking_date.desc())
            .all()
        )

        participants = []

        for booking in bookings:

            participants.append({
                "bookingid": booking.bookingid,
                "user_name": booking.user.name,
                "email": booking.user.email,
                "phone": booking.user.phone,
                "trek_title": booking.trek.trekname,
                "booking_date": (
                    booking.booking_date.strftime("%d %b %Y")
                    if booking.booking_date else None
                ),
                "status": booking.booking_status
            })

        trek_options = []

        for trek in trek_list:

            trek_options.append({
                "trekid": trek.trekid,
                "trekname": trek.trekname
            })

        return jsonify({
            "success": True,
            "data": {
                "participants": participants,
                "treks": trek_options,
                "filters": {
                    "search": search_query,
                    "status": status_filter,
                    "trek": trek_filter
                }
            }
        })


@staff_bp.route("/profile", methods=["GET", "PUT"])
def staff_profile():

    auth = staff_required()
    if auth:
        return auth

    with Session(engine) as db:

        user = (
            db.query(User)
            .filter(User.userid == session["userid"])
            .first()
        )

        staff = (
            db.query(StaffProfile)
            .filter(StaffProfile.userid == session["userid"])
            .first()
        )

        if not user or not staff:
            return jsonify({
                "success": False,
                "message": "Staff profile not found"
            }), 404

        if request.method == "PUT":

            data = request.get_json()

            user.name = data.get("name", user.name).strip()
            user.phone = data.get("phone", user.phone).strip()

            db.commit()

            return jsonify({
                "success": True,
                "message": "Profile updated successfully"
            })

        assigned_trek_count = (
            db.query(Trek)
            .filter(Trek.assigned_staff == staff.userid)
            .count()
        )

        return jsonify({
            "success": True,
            "data": {
                "user": {
                    "userid": user.userid,
                    "name": user.name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role
                },
                "staff": {
                    "staffid": staff.staffid,
                    "approval_status": staff.approval_status
                },
                "assigned_trek_count": assigned_trek_count
            }
        })