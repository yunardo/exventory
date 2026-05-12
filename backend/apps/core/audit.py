from dataclasses import dataclass

@dataclass(frozen=True)
class AuditActions:
    LOGIN = "login"
    LOGOUT = "logout"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    EXPORT = "export"
    CLOSE_PERIOD = "close_period"
    CLOSE_YEAR = "close_year"
    UFV_REPRICE = "ufv_reprice"