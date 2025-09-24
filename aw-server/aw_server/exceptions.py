import werkzeug.exceptions


class BadRequest(werkzeug.exceptions.BadRequest):
    def __init__(self, error_type: str, message: str) -> None:
        super().__init__(message)
        self.error_type = error_type


class NotFound(werkzeug.exceptions.NotFound):
    def __init__(self, error_type: str, message: str) -> None:
        super().__init__(message)
        self.error_type = error_type


class Unauthorized(werkzeug.exceptions.Unauthorized):
    def __init__(self, error_type: str, message: str) -> None:
        super().__init__(message)
        self.error_type = error_type
