
class NoSeasonFoundError(Exception):
    """Exception raised when no season is found."""
    pass


class MultipleSeasonsFoundError(Exception):
    """Exception raised when multiple seasons are found for same client."""
    pass
