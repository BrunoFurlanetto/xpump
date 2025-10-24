
class MultipleGroupMembersError(Exception):
    """Exception raised when multiple members are found in a group where only one is expected."""
    pass


class NothingMainGroupError(Exception):
    """Exception raised when no main group is found for a user."""
    pass
