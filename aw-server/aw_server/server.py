import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List

import aw_datastore
import flask.json.provider
from aw_datastore import Datastore
from flask import Blueprint, Flask, current_app, send_from_directory
from flask_apscheduler import APScheduler
from flask_cors import CORS

from . import rest
from .api import ServerAPI
from .custom_static import get_custom_static_blueprint
from .log import FlaskLogHandler

logger = logging.getLogger(__name__)

app_folder = os.path.dirname(os.path.abspath(__file__))
static_folder = os.path.join(app_folder, "static")

root = Blueprint("root", __name__, url_prefix="/")


class AWFlask(Flask):
    """ActivityWatch Flask Application.
    
    Custom Flask application class that initializes and configures the ActivityWatch server
    with datastore, API endpoints, CORS, and background synchronization tasks.
    """
    
    def __init__(
        self,
        host: str,
        testing: bool,
        storage_method=None,
        cors_origins=[],
        custom_static=dict(),
        static_folder=static_folder,
        static_url_path="",
        user_id: str = "default_user_id", # user_id parametresi eklendi
    ):
        name = "aw-server"
        
        # Configure JSON provider for custom datetime/timedelta serialization
        # Pretty-print JSON only in testing mode for better performance in production
        self.json_provider_class = CustomJSONProvider
        self.json_provider_class.compact = not testing

        # Initialize Flask with static file serving configuration
        Flask.__init__(
            self,
            name,
            static_folder=static_folder,
            static_url_path=static_url_path,
        )
        
        # Store host configuration for DNS rebinding protection
        self.config["HOST"] = host  # needed for host-header check
        
        # Configure CORS (Cross-Origin Resource Sharing) within app context
        with self.app_context():
            _config_cors(cors_origins, testing)

        # Initialize datastore backend - defaults to memory storage if not specified
        if storage_method is None:
            storage_method = aw_datastore.get_storage_methods()["memory"]
        db = Datastore(storage_method, testing=testing)
        
        # Initialize ServerAPI with configured datastore
        self.api = ServerAPI(db=db, testing=testing)

        # Register Flask blueprints for different URL namespaces
        self.register_blueprint(root)  # Root routes (/)
        self.register_blueprint(rest.blueprint)  # REST API routes (/api)
        self.register_blueprint(get_custom_static_blueprint(custom_static))  # Custom static files

        # Configure background task scheduler for periodic operations
        scheduler = APScheduler()
        scheduler.init_app(self)
        scheduler.start()

        # Schedule periodic Firebase synchronization every 4 hours
        @scheduler.task('interval', id='full_sync_job', hours=4)
        def periodic_sync_job():
            """Background task for periodic Firebase data synchronization."""
            with self.app_context():
                logger.info("Periyodik Firebase senkronizasyonu başlatılıyor...")
                # Run async sync in new event loop since APScheduler uses its own thread
                import asyncio
                asyncio.run(self.api.sync_data("full"))
                logger.info("Periyodik Firebase senkronizasyonu tamamlandı.")


class CustomJSONProvider(flask.json.provider.DefaultJSONProvider):
    # encoding/decoding of datetime as iso8601 strings
    # encoding of timedelta as second floats
    def default(self, obj, *args, **kwargs):
        try:
            if isinstance(obj, datetime):
                return obj.isoformat()
            if isinstance(obj, timedelta):
                return obj.total_seconds()
        except TypeError:
            pass
        return super().default(obj)


@root.route("/")
def static_root():
    return current_app.send_static_file("index.html")


@root.route("/css/<path:path>")
def static_css(path):
    return send_from_directory(static_folder + "/css", path)


@root.route("/js/<path:path>")
def static_js(path):
    return send_from_directory(static_folder + "/js", path)


def _config_cors(cors_origins: List[str], testing: bool):
    if cors_origins:
        logger.warning(
            "Running with additional allowed CORS origins specified through config "
            "or CLI argument (could be a security risk): {}".format(cors_origins)
        )

    if testing:
        # Used for development of aw-webui
        cors_origins.append("http://127.0.0.1:27180/*")

    # TODO: This could probably be more specific
    #       See https://github.com/ActivityWatch/aw-server/pull/43#issuecomment-386888769
    cors_origins.append("moz-extension://*")

    # See: https://flask-cors.readthedocs.io/en/latest/
    CORS(current_app, resources={r"/api/*": {"origins": cors_origins}})


# Only to be called from aw_server.main function!
def _start(
    storage_method,
    host: str,
    port: int,
    testing: bool = False,
    cors_origins: List[str] = [],
    custom_static: Dict[str, str] = dict(),
    user_id: str = "default_user_id", # user_id parametresi eklendi
):
    app = AWFlask(
        host,
        testing=testing,
        storage_method=storage_method,
        cors_origins=cors_origins,
        custom_static=custom_static,
        user_id=user_id, # user_id parametresi AWFlask'a iletildi
    )
    try:
        app.run(
            debug=testing,
            host=host,
            port=port,
            request_handler=FlaskLogHandler,
            use_reloader=False,
            threaded=True,
        )
    except OSError as e:
        logger.exception(e)
        raise e