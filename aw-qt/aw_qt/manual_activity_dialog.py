from PyQt5 import QtWidgets
from datetime import datetime
import requests, json


class ManualActivityDialog(QtWidgets.QDialog):
    def __init__(self, parent=None, server_url="http://127.0.0.1:5600/api/0"):
        super().__init__(parent)
        self.server_url = server_url
        self.setWindowTitle("Manual Activity")
        self.resize(300, 200)
        layout = QtWidgets.QFormLayout(self)

        self.label_edit = QtWidgets.QLineEdit()
        self.duration_edit = QtWidgets.QSpinBox()
        self.duration_edit.setMaximum(86400)
        self.category_edit = QtWidgets.QLineEdit()
        self.description_edit = QtWidgets.QPlainTextEdit()

        layout.addRow("Label", self.label_edit)
        layout.addRow("Duration (sec)", self.duration_edit)
        layout.addRow("Category", self.category_edit)
        layout.addRow("Description", self.description_edit)

        btn_box = QtWidgets.QDialogButtonBox(
            QtWidgets.QDialogButtonBox.Ok | QtWidgets.QDialogButtonBox.Cancel
        )
        btn_box.accepted.connect(self.submit)
        btn_box.rejected.connect(self.reject)
        layout.addRow(btn_box)

    def submit(self):
        payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "duration": self.duration_edit.value(),
            "data": {
                "label": self.label_edit.text(),
                "category": self.category_edit.text() or None,
                "description": self.description_edit.toPlainText() or None,
            },
        }
        # Remove None entries
        payload["data"] = {k: v for k, v in payload["data"].items() if v}
        try:
            requests.post(
                f"{self.server_url}/manualactivity",
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"},
            )
        except Exception as e:
            QtWidgets.QMessageBox.warning(self, "Error", str(e))
        self.accept()
