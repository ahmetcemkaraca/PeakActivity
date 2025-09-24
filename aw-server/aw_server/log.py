import logging
from google.cloud import logging as cloud_logging
from werkzeug import serving

# Cloud Logging istemcisini başlat
client = cloud_logging.Client()
handler = client.get_default_handler()
cloud_logger = logging.getLogger("cloud_logger")
cloud_logger.setLevel(logging.INFO)
cloud_logger.addHandler(handler)


class FlaskLogHandler(serving.WSGIRequestHandler):
    def __init__(self, *args):
        self.logger = logging.getLogger("flask")
        super().__init__(*args)

    def log(self, levelname, message, *args):
        msg = args[0]
        code = int(args[1])

        if code in [200, 304]:
            levelname = "debug"

        if levelname == "info":
            levelno = logging.INFO
        elif levelname == "debug":
            levelno = logging.DEBUG
        elif levelname == "warning":
            levelno = logging.WARNING
        elif levelname == "error":
            levelno = logging.ERROR
        elif levelname == "critical":
            levelno = logging.CRITICAL
        else:
            raise Exception("Unknown level " + levelname)

        log_message = f"{code} ({self.address_string()}): {msg}"
        self.logger.log(levelno, log_message)
        cloud_logger.log(levelno, log_message)  # Cloud Logging'e gönder
