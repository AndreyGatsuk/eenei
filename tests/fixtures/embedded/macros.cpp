#define LABEL(active) \
  ((active) ? "eenei" : "Archived")
#define REQUIRE_PROJECT(value) do { \
  /* Preview macro comment. */ \
  if (!(value)) return "Empty"; \
} while (0)

const char* label(bool active) { return LABEL(active); }
