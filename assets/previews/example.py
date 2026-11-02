from dataclasses import dataclass
from datetime import datetime

FROST_POINT = 0.0


@dataclass(frozen=True)
class Reading:
    """A quiet morning, measured in degrees."""

    station: str
    temperature: float
    observed_at: datetime

    @property
    def is_frost(self) -> bool:
        return self.temperature <= FROST_POINT


def morning_report(readings: list[Reading]) -> str:
    # Keep the coldest reading from each station.
    coldest: dict[str, Reading] = {}
    for reading in readings:
        previous = coldest.get(reading.station)
        if previous and previous.temperature <= reading.temperature:
            continue
        coldest[reading.station] = reading

    lines = ["Morning frost · field notes"]
    for station, reading in sorted(coldest.items()):
        if not reading.is_frost:
            continue
        time = reading.observed_at.strftime("%H:%M")
        lines.append(f"{station}: {reading.temperature:+.1f} °C at {time}")

    return "\n".join(lines)
