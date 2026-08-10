import csv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os
from datetime import date, timedelta
from calendar import monthrange

from celery_app import celery
from sqlalchemy.orm import Session

from models.models import engine, User, Trek, Booking


EXPORT_DIR = os.path.join(
    os.path.dirname(__file__),
    "exports"
)

os.makedirs(EXPORT_DIR, exist_ok=True)

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

def send_email(to_email, subject, body, is_html=False):

    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("Email credentials not configured")
        return

    message = MIMEMultipart()

    message["From"] = EMAIL_ADDRESS
    message["To"] = to_email
    message["Subject"] = subject

    if is_html:
        message.attach(MIMEText(body, "html"))
    else:
        message.attach(MIMEText(body, "plain"))

    try:

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(message)
        server.quit()

        print(f"Email sent to {to_email}")

    except Exception as e:

        print("Email sending failed:", e)

@celery.task(name="tasks.daily_trek_reminders")
def daily_trek_reminders():

    reminder_date = date.today() + timedelta(days=1)

    reminders_sent = 0

    with Session(engine) as db:

        bookings = (
            db.query(Booking)
            .join(User, Booking.userid == User.userid)
            .join(Trek, Booking.trekid == Trek.trekid)
            .filter(
                Trek.start_date == reminder_date,
                Booking.booking_status == "Booked"
            )
            .all()
        )

        for booking in bookings:

            subject = (
                f"Reminder: {booking.trek.trekname} starts tomorrow"
            )

            body = f"""
Hello {booking.user.name},

This is a reminder that your trek starts tomorrow.

Trek: {booking.trek.trekname}
Location: {booking.trek.location}
Start Date: {booking.trek.start_date}
End Date: {booking.trek.end_date}

Please report on time and carry the required trekking gear.

Happy Trekking!

Trekking Management Team
"""

            send_email(
                booking.user.email,
                subject,
                body
            )

            reminders_sent += 1

    return {
        "status": "SUCCESS",
        "reminders_sent": reminders_sent
    }

@celery.task(name="tasks.monthly_admin_report")
def monthly_admin_report():

    today = date.today()

    # Previous month range
    if today.month == 1:
        report_year = today.year - 1
        report_month = 12
    else:
        report_year = today.year
        report_month = today.month - 1

    start_date = date(report_year, report_month, 1)
    end_date = date(
        report_year,
        report_month,
        monthrange(report_year, report_month)[1]
    )

    with Session(engine) as db:

        # Treks conducted in the previous month
        treks = (
            db.query(Trek)
            .filter(
                Trek.start_date >= start_date,
                Trek.start_date <= end_date
            )
            .all()
        )

        total_treks = len(treks)

        trek_ids = [trek.trekid for trek in treks]

        if trek_ids:
            total_participants = (
                db.query(Booking)
                .filter(
                    Booking.trekid.in_(trek_ids),
                    Booking.booking_status == "Booked"
                )
                .count()
            )
        else:
            total_participants = 0

        popular_data = []

        for trek in treks:

            participant_count = (
                db.query(Booking)
                .filter(
                    Booking.trekid == trek.trekid,
                    Booking.booking_status == "Booked"
                )
                .count()
            )

            popular_data.append(
                (
                    trek.trekname,
                    trek.location,
                    participant_count
                )
            )

        popular_data.sort(
            key=lambda x: x[2],
            reverse=True
        )

        top = popular_data[:5]

        html = f"""
<html>
<body>

<h2>Monthly Trekking Activity Report</h2>

<p><strong>Reporting Period:</strong> {start_date.strftime("%B %Y")}</p>

<p><strong>Total Treks Conducted:</strong> {total_treks}</p>

<p><strong>Total Participants:</strong> {total_participants}</p>

<h3>Popular Treks</h3>

<table border="1" cellpadding="6" cellspacing="0">

<tr>
<th>Trek</th>
<th>Location</th>
<th>Participants</th>
</tr>
"""

        for trek_name, location, participants in top:

            html += f"""
<tr>
<td>{trek_name}</td>
<td>{location}</td>
<td>{participants}</td>
</tr>
"""

        html += """
</table>

<p>Generated automatically by Trekking Management Application.</p>

</body>
</html>
"""

        admin_user = (
            db.query(User)
            .filter(User.role == "admin")
            .first()
        )

        if admin_user:

            send_email(
                admin_user.email,
                "Monthly Trekking Activity Report",
                html,
                is_html=True
            )

    return {
        "status": "SUCCESS",
        "treks": total_treks,
        "participants": total_participants
    }

@celery.task(name="tasks.export_booking_history")
def export_booking_history(user_id):
    """
    Export user's booking history as CSV.
    """

    filename = (
        f"booking_history_user_{user_id}.csv"
    )

    filepath = os.path.join(
        EXPORT_DIR,
        filename
    )

    with Session(engine) as db:

        user = (
            db.query(User)
            .filter(User.userid == user_id)
            .first()
        )

        bookings = (
            db.query(Booking)
            .join(Trek, Booking.trekid == Trek.trekid)
            .filter(Booking.userid == user_id)
            .order_by(Booking.booking_date.desc())
            .all()
        )

        with open(
            filepath,
            "w",
            newline="",
            encoding="utf-8"
        ) as csvfile:

            writer = csv.writer(csvfile)

            writer.writerow([
                "User ID",
                "Trek Name",
                "Location",
                "Booking Status",
                "Booking Date",
                "Trek Start Date",
                "Trek End Date"
            ])

            for booking in bookings:

                writer.writerow([
                    booking.userid,
                    booking.trek.trekname,
                    booking.trek.location,
                    booking.booking_status,
                    booking.booking_date.strftime("%d-%m-%Y")
                    if booking.booking_date else "",
                    booking.trek.start_date.strftime("%d-%m-%Y")
                    if booking.trek.start_date else "",
                    booking.trek.end_date.strftime("%d-%m-%Y")
                    if booking.trek.end_date else ""
                ])

        if user:

            send_email(
                user.email,
                "Booking History Export Completed",
                f"""
Hello {user.name},

Your trekking history export has been completed.

File: {filename}

You can now download it from the application.

Trekking Management Team
"""
            )

    return filename


@celery.task(name="tasks.test_task")
def test_task():
    return {
        "status": "SUCCESS",
        "message": "Celery infrastructure is working"
    }