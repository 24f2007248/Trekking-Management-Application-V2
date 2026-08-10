from flask import Blueprint, jsonify, request, session, send_from_directory
from sqlalchemy.orm import Session
from datetime import datetime
import os
from celery.result import AsyncResult
from celery_app import celery
from tasks import export_booking_history as export_booking_history_task
from models.models import engine, User, Trek, Booking
from redis_client import get_cache, set_cache

user_bp = Blueprint(
    "user",
    __name__,
    url_prefix="/api/user"
)


def user_required():
    if "role" not in session or session["role"] != "user":
        return jsonify({
            "success": False,
            "message": "Unauthorized"
        }), 401

    return None


@user_bp.route("/dashboard", methods=["GET"])
def user_dashboard():

    auth = user_required()
    if auth:
        return auth

    with Session(engine) as db:

        available = (
            db.query(Trek)
            .filter(Trek.status == "Open")
            .order_by(Trek.start_date.asc())
            .limit(5)
            .all()
        )

        available_treks = []

        for trek in available:

            available_treks.append({
                "id": trek.trekid,
                "raw_id": trek.trekid,
                "name": trek.trekname,
                "location": trek.location,
                "difficulty": trek.difficulty,
                "duration": f"{trek.duration} Days",
                "slots": trek.available_slots
            })

        bookings = (
            db.query(Booking)
            .filter(Booking.userid == session["userid"])
            .order_by(Booking.booking_date.desc())
            .limit(5)
            .all()
        )

        recent_bookings = []

        for booking in bookings:

            recent_bookings.append({
                "trek_id": booking.trek.trekid,
                "trek_name": booking.trek.trekname,
                "booking_date": (
                    booking.booking_date.strftime("%d %b %Y")
                    if booking.booking_date else None
                ),
                "status": booking.booking_status
            })

        completed_count = (
            db.query(Booking)
            .join(Trek)
            .filter(
                Booking.userid == session["userid"],
                Trek.status == "Completed"
            )
            .count()
        )

        return jsonify({
            "success": True,
            "data": {
                "available_treks": available_treks,
                "my_bookings": recent_bookings,
                "completed_count": completed_count
            }
        })


@user_bp.route("/treks", methods=["GET"])
def user_treks():

    auth = user_required()
    if auth:
        return auth

    try:
        page = int(request.args.get("page", 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1

    PER_PAGE = 5

    search_query = request.args.get("search", "").strip()
    difficulty_filter = request.args.get("difficulty", "All")

    cache_key = (
        f"treks:user:"
        f"page={page}:"
        f"search={search_query}:"
        f"difficulty={difficulty_filter}"
    )

    cached_data = get_cache(cache_key)

    if cached_data:
        return jsonify(cached_data)

    with Session(engine) as db:

        query = db.query(Trek).filter(Trek.status == "Open")

        if search_query:
            query = query.filter(
                Trek.trekname.ilike(f"%{search_query}%") |
                Trek.location.ilike(f"%{search_query}%")
            )

        if difficulty_filter != "All":
            query = query.filter(
                Trek.difficulty == difficulty_filter
            )

        total_items = query.count()

        total_pages = (
            (total_items + PER_PAGE - 1) // PER_PAGE
            if total_items else 1
        )

        offset = (page - 1) * PER_PAGE

        results = (
            query
            .order_by(Trek.start_date.asc())
            .offset(offset)
            .limit(PER_PAGE)
            .all()
        )

        treks = []

        for trek in results:

            treks.append({

                "id": trek.trekid,
                "raw_id": trek.trekid,
                "name": trek.trekname,
                "location": trek.location,
                "difficulty": trek.difficulty,
                "duration": f"{trek.duration} Days",
                "slots": trek.available_slots,
                "status": trek.status
            })

        response_data = {

            "success": True,

            "data": {

                "treks": treks,

                "pagination": {

                    "page": page,
                    "per_page": PER_PAGE,
                    "total_items": total_items,
                    "total_pages": total_pages
                },

                "filters": {

                    "search": search_query,
                    "difficulty": difficulty_filter
                }
            }
        }

        set_cache(cache_key, response_data)

        return jsonify(response_data)
    

@user_bp.route("/treks/<int:trek_id>", methods=["GET"])
def user_trek_details(trek_id):
    auth = user_required()
    if auth:
        return auth

    with Session(engine) as db:

        trek = db.query(Trek).filter(Trek.trekid == trek_id).first()

        if not trek:
            return jsonify({
                "success": False,
                "message": "Trek not found"
            }), 404

        booking = (
            db.query(Booking)
            .filter(
                Booking.userid == session["userid"],
                Booking.trekid == trek_id
            )
            .first()
        )

        return jsonify({
            "success": True,
            "data": {
                "user_name": session.get("name", "User Member"),
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
                    "start_date": trek.start_date.strftime("%d %b %Y"),
                    "end_date": trek.end_date.strftime("%d %b %Y")
                },
                "booking": {
                    "booking_date": booking.booking_date.strftime("%d %b %Y")
                    if booking else "",
                    "booking_status": booking.booking_status
                    if booking else ""
                }
            }
        })

@user_bp.route("/treks/<int:trek_id>/book", methods=["POST"])
def book_trek(trek_id):

    auth = user_required()
    if auth:
        return auth

    with Session(engine) as db:

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

        # Check for any previous booking (Booked or Cancelled)
        existing_booking = (
            db.query(Booking)
            .filter(
                Booking.userid == session["userid"],
                Booking.trekid == trek_id
            )
            .first()
        )

        # Already booked
        if existing_booking and existing_booking.booking_status == "Booked":
            return jsonify({
                "success": False,
                "message": "You have already booked this trek"
            }), 400

        # Trek must be open
        if trek.status != "Open":
            return jsonify({
                "success": False,
                "message": "This trek is not open for booking"
            }), 400

        # Slots available
        if trek.available_slots <= 0:
            return jsonify({
                "success": False,
                "message": "No slots available"
            }), 400

        if existing_booking:
            existing_booking.booking_status = "Booked"
            existing_booking.booking_date = datetime.now()
            booking = existing_booking
        else:
            # Create a new booking
            booking = Booking(
                userid=session["userid"],
                trekid=trek.trekid,
                booking_status="Booked"
            )
            db.add(booking)

        trek.available_slots -= 1

        db.commit()
        db.refresh(booking)

        return jsonify({
            "success": True,
            "message": "Trek booked successfully",
            "data": {
                "bookingid": booking.bookingid,
                "trekid": trek.trekid,
                "trekname": trek.trekname
            }
        })


@user_bp.route("/bookings", methods=["GET"])
def user_bookings():

    auth = user_required()
    if auth:
        return auth

    history = request.args.get("history", "false").lower() == "true"

    try:
        page = int(request.args.get("page", 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1

    PER_PAGE = 5

    search_query = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "All")

    with Session(engine) as db:

        query = (
            db.query(Booking)
            .join(Trek, Booking.trekid == Trek.trekid)
            .filter(Booking.userid == session["userid"])
        )

        if history:
            query = query.filter(Trek.status == "Completed")
            status_filter = "Completed"

        elif status_filter != "All":
            query = query.filter(Trek.status == status_filter)

        if search_query:
            query = query.filter(
                Trek.trekname.ilike(f"%{search_query}%") |
                Trek.location.ilike(f"%{search_query}%")
            )

        total_items = query.count()

        total_pages = (
            (total_items + PER_PAGE - 1) // PER_PAGE
            if total_items else 1
        )

        offset = (page - 1) * PER_PAGE

        bookings = (
            query.order_by(Booking.booking_date.desc())
            .offset(offset)
            .limit(PER_PAGE)
            .all()
        )

        booking_list = []

        for booking in bookings:

            booking_list.append({
                "booking_id": booking.bookingid,
                "trek_id": booking.trek.trekid,
                "trek_name": booking.trek.trekname,
                "location": booking.trek.location,
                "booking_date": (
                    booking.booking_date.strftime("%d %b %Y")
                    if booking.booking_date else None
                ),
                "trek_status": booking.trek.status,
                "booking_status": booking.booking_status
            })

        return jsonify({

            "success": True,

            "data": {

                "bookings": booking_list,

                "pagination": {
                    "page": page,
                    "per_page": PER_PAGE,
                    "total_items": total_items,
                    "total_pages": total_pages
                },

                "filters": {
                    "search": search_query,
                    "status": status_filter,
                    "history": history
                }
            }
        })

@user_bp.route("/bookings/export", methods=["POST"])
def export_booking_history():

    auth = user_required()
    if auth:
        return auth

    task = export_booking_history_task.delay(
        session["userid"]
    )

    return jsonify({
        "success": True,
        "message": "Export started",
        "data": {
            "task_id": task.id
        }
    })

@user_bp.route("/bookings/export/status/<task_id>", methods=["GET"])
def export_status(task_id):

    auth = user_required()
    if auth:
        return auth

    task = AsyncResult(
        task_id,
        app=celery
    )

    if task.state == "PENDING":

        return jsonify({
            "success": True,
            "data": {
                "state": "PENDING"
            }
        })

    if task.state == "SUCCESS":

        return jsonify({
            "success": True,
            "data": {
                "state": "SUCCESS",
                "filename": task.result
            }
        })

    if task.state == "FAILURE":

        return jsonify({
            "success": False,
            "data": {
                "state": "FAILURE",
                "error": str(task.result)
            }
        })

    return jsonify({
        "success": True,
        "data": {
            "state": task.state
        }
    })

@user_bp.route("/bookings/export/download/<filename>", methods=["GET"])
def download_export(filename):

    auth = user_required()
    if auth:
        return auth

    export_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "exports"
    )

    return send_from_directory(
        export_dir,
        filename,
        as_attachment=True
    )

@user_bp.route("/profile", methods=["GET", "PUT"])
def user_profile():

    auth = user_required()
    if auth:
        return auth

    with Session(engine) as db:

        user = (
            db.query(User)
            .filter(User.userid == session["userid"])
            .first()
        )

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        if request.method == "PUT":

            data = request.get_json()

            if "name" in data:
                user.name = data["name"].strip()

            if "phone" in data:
                user.phone = data["phone"].strip()

            db.commit()

            return jsonify({
                "success": True,
                "message": "Profile updated successfully"
            })

        total_bookings = (
            db.query(Booking)
            .filter(Booking.userid == user.userid)
            .count()
        )

        completed_treks = (
            db.query(Booking)
            .join(Trek, Booking.trekid == Trek.trekid)
            .filter(
                Booking.userid == user.userid,
                Trek.status == "Completed"
            )
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
                "total_bookings": total_bookings,
                "completed_treks": completed_treks
            }
        })


@user_bp.route("/bookings/<int:booking_id>/cancel", methods=["PATCH"])
def cancel_booking(booking_id):

    auth = user_required()
    if auth:
        return auth

    with Session(engine) as db:

        booking = (
            db.query(Booking)
            .filter(
                Booking.bookingid == booking_id,
                Booking.userid == session["userid"],
                Booking.booking_status == "Booked"
            )
            .first()
        )

        if not booking:
            return jsonify({
                "success": False,
                "message": "Booking not found"
            }), 404

        trek = booking.trek

        if trek.status != "Open":
            return jsonify({
                "success": False,
                "message": "Booking cannot be cancelled after the trek has started"
            }), 400

        booking.booking_status = "Cancelled"

        if trek.available_slots < trek.total_slots:
            trek.available_slots += 1

        db.commit()

        return jsonify({
            "success": True,
            "message": "Booking cancelled successfully"
        })