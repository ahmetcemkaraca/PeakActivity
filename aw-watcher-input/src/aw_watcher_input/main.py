import logging
from datetime import datetime, timezone
from time import sleep

import aw_client
import click
from aw_core import Event
from aw_watcher_afk.listeners import KeyboardListener, MouseListener
from aw_watcher_window.lib import get_current_window  # get_current_window'ı içe aktar

logger = logging.getLogger(__name__)

# Ortak IDE ve geliştirme araçları listesi (uygulama adları veya pencere başlıklarındaki anahtar kelimeler)
IDE_APP_NAMES = [
    "Code",
    "idea64",
    "pycharm64",
    "WebStorm",
    "Visual Studio",
    "Eclipse",
    "Android Studio",
    "Xcode",
    "Sublime Text",
    "Atom",
    "VSCodium",
    "Cursor",
    "Notepad++",
    "vim",
    "nvim",
    "emacs",
    "Jupyter",
    "RStudio",
    "Spyder",
    "VS Code",
]

# Hata ayıklama modunu gösterebilecek anahtar kelimeler (pencere başlıklarında veya loglarda)
DEBUG_KEYWORDS = [
    "debug",
    "debugging",
    "debugger",
    "gdb",
    "lldb",
    "pdb",
    "inspect",
    "profiler",
]


def classify_activity_context(
    app_name: str, window_title: str, keyboard_data: dict, mouse_data: dict
) -> dict:
    is_coding = False
    is_debugging = False

    # IDE tespiti
    is_ide_active = any(
        ide_name.lower() in app_name.lower() or ide_name.lower() in window_title.lower()
        for ide_name in IDE_APP_NAMES
    )

    if is_ide_active:
        # Klavye ve fare aktivitesine göre kod yazma/hata ayıklama ayrımı
        # Basit bir heuristik: Çok sayıda tuş vuruşu kod yazmayı gösterirken,
        # fare aktivitesiyle birlikte daha az tuş vuruşu hata ayıklamayı gösterebilir.
        # Daha gelişmiş analizler için geçmiş aktivite desenleri kullanılabilir.
        total_keys = sum(keyboard_data.values())
        total_clicks = sum(mouse_data.values())

        if (
            total_keys > 5 and total_clicks < 2
        ):  # Yüksek tuş vuruşu, düşük fare tıklaması = kod yazma
            is_coding = True
        elif (
            total_clicks > 0 and total_keys < 3
        ):  # Fare aktivitesi, düşük tuş vuruşu = hata ayıklama (örn: breakpoint ile gezinme)
            is_debugging = True
        elif any(keyword.lower() in window_title.lower() for keyword in DEBUG_KEYWORDS):
            is_debugging = True

    return {"is_coding": is_coding, "is_debugging": is_debugging}


@click.command()
@click.option("--testing", is_flag=True)
def main(testing: bool):
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting watcher...")
    client = aw_client.ActivityWatchClient("aw-watcher-input", testing=testing)
    client.wait_for_start()
    client.connect()

    # Create bucket
    bucket_name = "{}_{}".format(client.client_name, client.client_hostname)
    eventtype = "os.hid.input"
    client.create_bucket(bucket_name, eventtype, queued=False)
    poll_time = 5

    keyboard = KeyboardListener()
    keyboard.start()
    mouse = MouseListener()
    mouse.start()

    now = datetime.now(tz=timezone.utc)

    while True:
        last_run = now

        # we want to ensure that the polling happens with a predictable cadence
        time_to_sleep = poll_time - datetime.now().timestamp() % poll_time
        # ensure that the sleep time is between 0 and poll_time (if system time is changed, this might be negative)
        time_to_sleep = max(min(time_to_sleep, poll_time), 0)
        sleep(time_to_sleep)

        now = datetime.now(tz=timezone.utc)

        # If input:    Send a heartbeat with data, ensure the span is correctly set, and don't use pulsetime.
        # If no input: Send a heartbeat with all-zeroes in the data, use a pulsetime.
        # FIXME: Doesn't account for scrolling
        # FIXME: Counts both keyup and keydown
        keyboard_data = keyboard.next_event()
        mouse_data = mouse.next_event()
        merged_data = dict(**keyboard_data, **mouse_data)

        # Aktif pencere bilgilerini al
        current_window = None
        try:
            current_window = (
                get_current_window()
            )  # macOS için strategy parametresi gerekebilir, şimdilik varsayılan
        except ImportError as import_e:
            logger.warning("Window tracking module not available: %s", import_e)
        except (OSError, PermissionError) as perm_e:
            logger.warning("Permission or OS error getting window info: %s", perm_e)
        except AttributeError as attr_e:
            logger.warning("Window API attribute error: %s", attr_e)
        except ValueError as val_e:
            logger.warning("Invalid parameter for window detection: %s", val_e)

        if current_window:
            app_name = current_window.get("app", "unknown")
            window_title = current_window.get("title", "unknown")

            # Aktivite bağlamını sınıflandır
            context_flags = classify_activity_context(
                app_name, window_title, keyboard_data, mouse_data
            )
            merged_data.update(context_flags)

        e = Event(timestamp=last_run, duration=(now - last_run), data=merged_data)

        pulsetime = 0.0
        if all(map(lambda v: v == 0, merged_data.values())):
            pulsetime = poll_time + 0.1
            logger.info("No new input")
        else:
            logger.info(f"New input: {e}")

        client.heartbeat(bucket_name, e, pulsetime=pulsetime, queued=True)
