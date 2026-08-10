from celery import Celery
from celery.schedules import crontab

celery = Celery(
    "trekking_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=False,

    beat_schedule={

        "daily-trek-reminders": {
            "task": "tasks.daily_trek_reminders",
            "schedule": crontab(hour=16, minute=57)
        },

        "monthly-admin-report": {
            "task": "tasks.monthly_admin_report",
            "schedule": crontab(
                day_of_month=10,
                hour=17,
                minute=5
            )
        }

    }
)