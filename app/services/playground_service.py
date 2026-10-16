"""Safe playground simulations.

Every supported formula is implemented as plain Python arithmetic or string
handling. There is no eval(), no exec() and no execution of user input.
"""

from typing import Callable, List, Tuple

from . import formula_service

SIMULATION_NOTE = (
    "Simulated in the browser backend for learning purposes - results are not "
    "produced by Microsoft Excel."
)


class PlaygroundError(Exception):
    pass


def _parse_values(raw: str) -> List[str]:
    parts = [part.strip() for part in raw.replace(";", ",").split(",")]
    return [part for part in parts if part != ""]


def _numbers(values: List[str], name: str) -> List[float]:
    numbers: List[float] = []
    for value in values:
        try:
            numbers.append(float(value.replace(",", "")))
        except ValueError:
            raise PlaygroundError(
                f"{name} expects numeric values, but \"{value}\" is not a number."
            )
    if not numbers:
        raise PlaygroundError("Enter at least one value, separated by commas.")
    return numbers


def _fmt(value: float) -> str:
    if float(value).is_integer():
        return str(int(value))
    return f"{value:.6g}"


def _sum(values: List[str]) -> Tuple[str, List[str]]:
    nums = _numbers(values, "SUM")
    return _fmt(sum(nums)), [f"Add {len(nums)} numbers: {' + '.join(_fmt(n) for n in nums)}"]


def _average(values: List[str]) -> Tuple[str, List[str]]:
    nums = _numbers(values, "AVERAGE")
    result = sum(nums) / len(nums)
    return _fmt(result), [f"{_fmt(sum(nums))} / {len(nums)} = {_fmt(result)}"]


def _count(values: List[str]) -> Tuple[str, List[str]]:
    nums = _numbers(values, "COUNT")
    return str(len(nums)), [f"{len(nums)} of the supplied entries are numbers."]


def _counta(values: List[str]) -> Tuple[str, List[str]]:
    return str(len(values)), [f"{len(values)} entries were supplied and none were empty."]


def _max(values: List[str]) -> Tuple[str, List[str]]:
    nums = _numbers(values, "MAX")
    return _fmt(max(nums)), ["Largest value found in the list."]


def _min(values: List[str]) -> Tuple[str, List[str]]:
    nums = _numbers(values, "MIN")
    return _fmt(min(nums)), ["Smallest value found in the list."]


def _product(values: List[str]) -> Tuple[str, List[str]]:
    nums = _numbers(values, "PRODUCT")
    result = 1.0
    for number in nums:
        result *= number
    return _fmt(result), [f"Multiply {len(nums)} numbers together."]


def _round_generic(mode: str) -> Callable[[List[str]], Tuple[str, List[str]]]:
    def handler(values: List[str]) -> Tuple[str, List[str]]:
        nums = _numbers(values, mode.upper())
        number = nums[0]
        digits = int(nums[1]) if len(nums) > 1 else 0
        if mode == "up":
            factor = 10 ** digits
            result = float(int(-(-number * factor) // 1)) / factor
        elif mode == "down":
            factor = 10 ** digits
            result = float(int(number * factor)) / factor
        else:
            result = round(number + (1e-12 if number >= 0 else -1e-12), digits)
        return _fmt(result), [f"Round {number} to {digits} decimal place(s)."]
    return handler


def _abs_value(values: List[str]) -> Tuple[str, List[str]]:
    nums = _numbers(values, "ABS")
    return _fmt(abs(nums[0])), ["Strip the sign and keep the magnitude."]


def _sqrt(values: List[str]) -> Tuple[str, List[str]]:
    nums = _numbers(values, "SQRT")
    if nums[0] < 0:
        raise PlaygroundError("SQRT requires a non-negative number.")
    result = nums[0] ** 0.5
    return _fmt(result), [f"Square root of {nums[0]}."]


def _text(fn: str) -> Callable[[List[str]], Tuple[str, List[str]]]:
    def handler(values: List[str]) -> Tuple[str, List[str]]:
        if not values:
            raise PlaygroundError(f"{fn} expects a text value.")
        text = values[0]
        if fn == "UPPER":
            return text.upper(), ["Convert every letter to uppercase."]
        if fn == "LOWER":
            return text.lower(), ["Convert every letter to lowercase."]
        if fn == "TRIM":
            return text.strip(), ["Remove leading and trailing spaces."]
        if fn == "LEN":
            return str(len(text)), [f"Count characters in \"{text}\"."]
        if fn == "PROPER":
            return text.title(), ["Capitalise the first letter of each word."]
        raise PlaygroundError(f"Unsupported text function {fn}.")
    return handler


def _left(values: List[str]) -> Tuple[str, List[str]]:
    if len(values) < 2:
        raise PlaygroundError("LEFT expects text and a character count, e.g. Invoice-1042, 8")
    count = int(float(values[1]))
    return values[0][:count], [f"Take the first {count} characters."]


def _right(values: List[str]) -> Tuple[str, List[str]]:
    if len(values) < 2:
        raise PlaygroundError("RIGHT expects text and a character count, e.g. INV-2024-88, 2")
    count = int(float(values[1]))
    return values[0][-count:] if count else "", [f"Take the last {count} characters."]


def _mid(values: List[str]) -> Tuple[str, List[str]]:
    if len(values) < 3:
        raise PlaygroundError("MID expects text, a start position and a length, e.g. ID-2024-0091, 4, 4")
    start = int(float(values[1]))
    length = int(float(values[2]))
    result = values[0][start - 1 : start - 1 + length]
    return result, [f"Extract {length} characters starting at position {start}."]


def _concat(values: List[str]) -> Tuple[str, List[str]]:
    if not values:
        raise PlaygroundError("Enter at least one text value.")
    return "".join(values), ["Join every supplied value with no separator."]


def _textjoin(values: List[str]) -> Tuple[str, List[str]]:
    if not values:
        raise PlaygroundError("Enter at least one text value.")
    delimiter = values[0] if len(values) > 1 else ", "
    items = values[1:] if len(values) > 1 else values
    return delimiter.join(items), [f"Join {len(items)} values with \"{delimiter}\" as the delimiter."]


HANDLERS: dict = {
    "sum": _sum,
    "average": _average,
    "count": _count,
    "counta": _counta,
    "max": _max,
    "min": _min,
    "product": _product,
    "round": _round_generic("round"),
    "roundup": _round_generic("up"),
    "rounddown": _round_generic("down"),
    "abs": _abs_value,
    "sqrt": _sqrt,
    "upper": _text("UPPER"),
    "lower": _text("LOWER"),
    "trim": _text("TRIM"),
    "len": _text("LEN"),
    "proper": _text("PROPER"),
    "left": _left,
    "right": _right,
    "mid": _mid,
    "concat": _concat,
    "textjoin": _textjoin,
}


def supported_formulas() -> List[str]:
    return sorted(HANDLERS.keys())


def simulate(formula_id: str, raw_values: str) -> dict:
    formula = formula_service.get_formula(formula_id)
    if not formula:
        raise PlaygroundError(f"Unknown formula: {formula_id}")
    handler = HANDLERS.get(formula["id"])
    if handler is None:
        raise PlaygroundError(
            f"{formula['name']} is not available in the playground. "
            f"Supported formulas: {', '.join(supported_formulas())}."
        )
    values = _parse_values(raw_values)
    if not values:
        raise PlaygroundError(f"Enter sample values for {formula['name']}, separated by commas.")
    result, steps = handler(values)
    return {
        "formula_id": formula["id"],
        "name": formula["name"],
        "syntax": formula["syntax"],
        "mode": "simulated",
        "simulated": True,
        "result": result,
        "steps": steps,
        "note": SIMULATION_NOTE,
    }
