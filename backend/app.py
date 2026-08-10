from flask import Flask, send_from_directory
import os
import sys
import subprocess
import atexit
from controllers import register_blueprints
from models import admin

celery_worker = None
celery_beat = None


def start_celery():
    """
    Automatically start Celery worker and Celery Beat only once.
    """

    global celery_worker, celery_beat

    # Flask debug mode starts two processes.
    # Only start Celery in the reloader child process.
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        return

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    python_executable = sys.executable

    celery_worker = subprocess.Popen(
        [
            python_executable,
            "-m",
            "celery",
            "-A",
            "tasks",
            "worker",
            "--loglevel=info"
        ],
        cwd=backend_dir
    )

    celery_beat = subprocess.Popen(
        [
            python_executable,
            "-m",
            "celery",
            "-A",
            "tasks",
            "beat",
            "--loglevel=info"
        ],
        cwd=backend_dir
    )

    atexit.register(stop_celery)


def stop_celery():

    global celery_worker, celery_beat

    if celery_worker and celery_worker.poll() is None:
        celery_worker.terminate()

    if celery_beat and celery_beat.poll() is None:
        celery_beat.terminate()

def create_app():

    start_celery()

    app = Flask(__name__)
    app.secret_key = "123"

    admin.initialize_database()

    register_blueprints(app)

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    frontend_dir = os.path.join(root_dir, "frontend")

    @app.route("/")
    def index():
        return send_from_directory(frontend_dir, "index.html")

    @app.route("/frontend/<path:filename>")
    def frontend_files(filename):
        return send_from_directory(os.path.join(root_dir, "frontend"), filename)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)