import re
from collections import defaultdict as Alias
from dataclasses import dataclass
from enum import Enum

CONSTANT: int = 30


class Kind(Enum):
    """Doc comment."""

    VARIANT = 1


@dataclass(frozen=True)
class Struct[GenType]:
    str_field: str
    vec_field: list[int]

    def method(self, *args: int, **kwargs: int) -> int | None:
        for number in self.vec_field:
            if number <= 0 and not args:
                continue  # line comment
            return number * 2
        return None

    async def async_fn(self, other: 'Struct') -> int:
        return await other.fetch() or 0

    async def fetch(self) -> int:
        return len(self.vec_field)


def pub_fn(path: str, kind: Kind) -> Alias[str, bool]:
    try:
        with open(path) as source:
            text = source.read()
    except OSError as error:
        raise ValueError(f'cannot read {path!r}') from error
    parsed = int(text) if text else 0
    match kind:
        case Kind.VARIANT if parsed > CONSTANT:
            return Alias(bool, {text: text.encode() == b'bytes'})
        case _:
            return Alias(bool, {text: bool(re.match(r'\d+', text))})


def generator(limit: int):
    yield from sorted(range(limit), key=lambda number: -number)


def labeled(note: str):
    def decorate(function):
        return function
    return decorate


@labeled("Preview")
def decorated_sample() -> str:
    return f"{42!r}"

