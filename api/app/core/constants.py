import uuid

# Phase 1 skips real authentication. Every home is owned by this fixed test
# user. The user row is seeded by the initial migration (and by the test
# fixtures) so foreign keys to it always resolve.
DEFAULT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_USER_EMAIL = "demo@homeops.local"
DEFAULT_USER_DISPLAY_NAME = "Demo User"
