"""
Schema detection service.

Given a list of raw CSV headers from an uploaded file, this module:
1. Validates the file headers (empty, duplicates, missing header row).
2. Normalises headers (lowercase, strip whitespace/punctuation).
3. Compares normalised headers against each marketplace's alias list using
   exact match first, then fuzzy difflib similarity as a fallback.
4. Returns the best-matching marketplace, its confidence score, and a
   proposed {internal_field: source_column} mapping.
5. If best confidence < CONFIDENCE_THRESHOLD, returns marketplace=None and
   an empty proposed mapping, forcing full manual mapping in the UI.
"""

import re
import difflib
import logging
from typing import Dict, List, Optional, Tuple

from app.services.schema_registry import (
    REGISTRY,
    REQUIRED_INTERNAL_FIELDS,
    OPTIONAL_INTERNAL_FIELDS,
    ALL_INTERNAL_FIELDS,
)

logger = logging.getLogger(__name__)

# Below this confidence, marketplace is marked unrecognised and manual mapping
# is required for all fields.
CONFIDENCE_THRESHOLD = 0.70

# Minimum difflib similarity ratio to count a fuzzy match.
FUZZY_THRESHOLD = 0.80


def _normalise(text: str) -> str:
    """Lowercase + strip leading/trailing whitespace + collapse interior spaces.
    Does NOT remove punctuation so that 'ship-state' still matches 'ship-state'.
    """
    return re.sub(r"\s+", " ", text.strip().lower())


def _similarity(a: str, b: str) -> float:
    """difflib sequence-matcher similarity ratio, 0.0 – 1.0."""
    return difflib.SequenceMatcher(None, a, b).ratio()


def validate_headers(raw_headers: List[str]) -> Optional[str]:
    """
    Validate raw CSV headers before detection.

    Returns an error message string if invalid, or None if valid.
    """
    # Filter out empty / whitespace-only / unnamed artifact columns
    meaningful = [
        h for h in raw_headers
        if h.strip() and not re.match(r"^unnamed:\s*\d+$", h.strip().lower())
    ]

    if not meaningful:
        return "CSV file has no recognisable header row."

    # Check for duplicate meaningful headers
    seen: set = set()
    duplicates: set = set()
    for h in meaningful:
        key = _normalise(h)
        if key in seen:
            duplicates.add(h.strip())
        seen.add(key)

    if duplicates:
        return f"CSV has duplicate column headers: {', '.join(sorted(duplicates))}."

    return None  # valid


def _match_header_to_aliases(
    normalised_source: str,
    aliases: List[str],
) -> Tuple[bool, float]:
    """
    Try to match a single normalised source header against a list of aliases.

    Returns (matched: bool, best_score: float).
    Exact match scores 1.0. Fuzzy matches above FUZZY_THRESHOLD are accepted.
    """
    for alias in aliases:
        normalised_alias = _normalise(alias)
        if normalised_source == normalised_alias:
            return True, 1.0
        score = _similarity(normalised_source, normalised_alias)
        if score >= FUZZY_THRESHOLD:
            return True, score
    return False, 0.0


def detect_schema(raw_headers: List[str]) -> Dict:
    """
    Detect marketplace and propose a column mapping from raw CSV headers.

    Returns a dict:
    {
        "marketplace": str | None,
        "confidence": float,
        "proposed_mapping": {internal_field: source_column},
        "unmatched_required_fields": [internal_field, ...],
        "validation_error": str | None,
    }
    """
    validation_error = validate_headers(raw_headers)
    if validation_error:
        return {
            "marketplace": None,
            "confidence": 0.0,
            "proposed_mapping": {},
            "unmatched_required_fields": list(REQUIRED_INTERNAL_FIELDS),
            "validation_error": validation_error,
        }

    # Filter out unnamed/empty columns for matching purposes, but keep the
    # original list available so we can reference the real source column name.
    meaningful_headers = [
        h for h in raw_headers
        if h.strip() and not re.match(r"^unnamed:\s*\d+$", h.strip().lower())
    ]
    normalised_headers = {h: _normalise(h) for h in meaningful_headers}

    best_marketplace: Optional[str] = None
    best_confidence: float = 0.0
    best_mapping: Dict[str, str] = {}
    best_unmatched: List[str] = list(REQUIRED_INTERNAL_FIELDS)

    for marketplace, field_aliases in REGISTRY.items():
        if not field_aliases:
            # Stub marketplace with no aliases — skip detection entirely
            continue

        mapping: Dict[str, str] = {}
        matched_required = 0

        for internal_field in ALL_INTERNAL_FIELDS:
            aliases = field_aliases.get(internal_field, [])
            if not aliases:
                continue

            best_source: Optional[str] = None
            best_score: float = 0.0

            for source_col, norm_source in normalised_headers.items():
                matched, score = _match_header_to_aliases(norm_source, aliases)
                if matched and score > best_score:
                    best_score = score
                    best_source = source_col

            if best_source is not None:
                mapping[internal_field] = best_source
                if internal_field in REQUIRED_INTERNAL_FIELDS:
                    matched_required += 1

        confidence = matched_required / len(REQUIRED_INTERNAL_FIELDS)
        unmatched = [f for f in REQUIRED_INTERNAL_FIELDS if f not in mapping]

        logger.debug(
            "Schema detection — marketplace=%s confidence=%.2f matched_required=%d/%d",
            marketplace,
            confidence,
            matched_required,
            len(REQUIRED_INTERNAL_FIELDS),
        )

        if confidence > best_confidence:
            best_confidence = confidence
            best_marketplace = marketplace
            best_mapping = mapping
            best_unmatched = unmatched

    # Apply threshold: if best confidence is too low, force manual mapping
    if best_confidence < CONFIDENCE_THRESHOLD:
        logger.info(
            "Schema detection: best confidence %.2f below threshold %.2f — "
            "marking as unrecognised, forcing full manual mapping.",
            best_confidence,
            CONFIDENCE_THRESHOLD,
        )
        return {
            "marketplace": None,
            "confidence": best_confidence,
            "proposed_mapping": {},
            "unmatched_required_fields": list(REQUIRED_INTERNAL_FIELDS),
            "validation_error": None,
        }

    logger.info(
        "Schema detection: detected marketplace=%s confidence=%.2f unmatched=%s",
        best_marketplace,
        best_confidence,
        best_unmatched,
    )

    return {
        "marketplace": best_marketplace,
        "confidence": best_confidence,
        "proposed_mapping": best_mapping,
        "unmatched_required_fields": best_unmatched,
        "validation_error": None,
    }
