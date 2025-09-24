import logging
import os
import platform
from datetime import datetime, timedelta, timezone
from time import sleep

from aw_client import ActivityWatchClient
from aw_core.constants import AFKStatus, BucketType
from aw_core.models import Event

from .config import load_config

system = platform.system()

if system == "Windows":
    # noreorder
    from .windows import seconds_since_last_input  # fmt: skip
elif system == "Darwin":
    # noreorder
    from .macos import seconds_since_last_input  # fmt: skip
elif system == "Linux":
    # noreorder
    from .unix import seconds_since_last_input  # fmt: skip
else:
    raise Exception(f"Unsupported platform: {system}")


logger = logging.getLogger(__name__)
td1ms = timedelta(milliseconds=1)


class Settings:
    def __init__(
        self, config_section, timeout=None, poll_time=None, thinking_timeout=None
    ):
        # Time without input before we're considering the user as AFK
        self.timeout = timeout or config_section["timeout"]
        # Time without input before we're considering the user as thinking
        self.thinking_timeout = thinking_timeout or config_section["thinking_timeout"]
        # How often we should poll for input activity
        self.poll_time = poll_time or config_section["poll_time"]

        assert self.timeout >= self.poll_time
        assert self.thinking_timeout >= self.poll_time
        assert (
            self.timeout > self.thinking_timeout
        )  # AFK zaman aşımı düşünme zamanından büyük olmalı


class AFKWatcher:
    def __init__(self, args, testing=False):
        # Read settings from config
        self.settings = Settings(
            load_config(testing),
            timeout=args.timeout,
            poll_time=args.poll_time,
            thinking_timeout=args.thinking_timeout,
        )

        self.client = ActivityWatchClient(
            "aw-watcher-afk", host=args.host, port=args.port, testing=testing
        )
        self.bucketname = "{}_{}".format(
            self.client.client_name, self.client.client_hostname
        )

    def ping(self, status: str, timestamp: datetime, duration: float = 0):
        data = {"status": status}
        e = Event(timestamp=timestamp, duration=duration, data=data)
        pulsetime = self.settings.timeout + self.settings.poll_time
        self.client.heartbeat(self.bucketname, e, pulsetime=pulsetime, queued=True)

    def run(self):
        logger.info("aw-watcher-afk started")

        # Initialization
        self.client.wait_for_start()

        eventtype = BucketType.AFK_WATCHER.value
        self.client.create_bucket(self.bucketname, eventtype, queued=True)

        # Start afk checking loop
        with self.client:
            self.heartbeat_loop()

    def heartbeat_loop(self):
        current_status = AFKStatus.NOT_AFK.value
        while True:
            try:
                if system in ["Darwin", "Linux"] and os.getppid() == 1:
                    # TODO: This won't work with PyInstaller which starts a bootloader process which will become the parent.
                    #       There is a solution however.
                    #       See: https://github.com/ActivityWatch/aw-qt/issues/19#issuecomment-316741125
                    logger.info("afkwatcher stopped because parent process died")
                    break

                now = datetime.now(timezone.utc)
                seconds_since_input = seconds_since_last_input()
                last_input = now - timedelta(seconds=seconds_since_input)
                logger.debug(f"Seconds since last input: {seconds_since_input}")

                new_status = AFKStatus.NOT_AFK.value
                if seconds_since_input >= self.settings.timeout:
                    new_status = AFKStatus.AFK.value
                elif seconds_since_input >= self.settings.thinking_timeout:
                    new_status = "thinking-time"

                if new_status != current_status:
                    logger.info(f"Status changed from {current_status} to {new_status}")
                    # Geçiş durumunu pingle
                    self.ping(new_status, timestamp=last_input)
                    current_status = new_status
                else:
                    # Durum değişmediyse heartbeat gönder
                    if new_status == "afk" or new_status == "thinking-time":
                        # AFK veya düşünme durumundaysak, süreyi güncelleyerek ping gönder
                        self.ping(
                            new_status,
                            timestamp=last_input
                            + td1ms,  # Bir sonraki olayın zaman damgasını doğru ayarla
                            duration=seconds_since_input,
                        )
                    else:
                        # Not-AFK ise, sadece bir heartbeat gönder
                        self.ping(new_status, timestamp=last_input)

                sleep(self.settings.poll_time)

            except KeyboardInterrupt:
                logger.info("aw-watcher-afk stopped by keyboard interrupt")
                break
