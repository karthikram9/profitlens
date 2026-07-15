"""
Marketplace schema registry.

Maps each marketplace name to a dict of:
  internal_field_name -> [list of known column header aliases]

The "amazon" entry is populated from the real headers of Amazon Sale Report.csv:
  index, Order ID, Date, Status, Fulfilment, Sales Channel , ship-service-level,
  Style, SKU, Category, Size, ASIN, Courier Status, Qty, currency, Amount,
  ship-city, ship-state, ship-postal-code, ship-country, promotion-ids, B2B,
  fulfilled-by, Unnamed: 22

Required internal fields that must be present for processing:
  order_id, date, status, fulfilment, category, qty, amount,
  ship_state, b2b

Optional fields that improve analysis if present:
  ship_city, sku, ship_service_level, sales_channel, size
"""

from typing import Dict, List

# Internal field names — these are the canonical names used throughout the
# backend pipeline. Source CSV columns get renamed to these after mapping
# confirmation. Never use marketplace-specific column names past this point.
REQUIRED_INTERNAL_FIELDS: List[str] = [
    "order_id",
    "date",
    "status",
    "fulfilment",
    "category",
    "qty",
    "amount",
    "ship_state",
    "b2b",
]

OPTIONAL_INTERNAL_FIELDS: List[str] = [
    "ship_city",
    "sku",
    "ship_service_level",
    "sales_channel",
    "size",
]

ALL_INTERNAL_FIELDS: List[str] = REQUIRED_INTERNAL_FIELDS + OPTIONAL_INTERNAL_FIELDS

# Registry: marketplace_name -> {internal_field: [alias, alias, ...]}
# Aliases are the raw header strings as they appear in the CSV.
# Detection normalises both sides (lowercase + strip) before matching,
# but the original case is preserved here for documentation clarity.
REGISTRY: Dict[str, Dict[str, List[str]]] = {
    "amazon": {
        # Required fields — populated from the real Amazon Sale Report.csv headers
        "order_id":           ["Order ID"],
        "date":               ["Date"],
        "status":             ["Status"],
        "fulfilment":         ["Fulfilment"],
        "category":           ["Category"],
        "qty":                ["Qty"],
        "amount":             ["Amount"],
        "ship_state":         ["ship-state", "Ship State"],
        "b2b":                ["B2B"],
        # Optional fields
        "ship_city":          ["ship-city", "Ship City"],
        "sku":                ["SKU"],
        "ship_service_level": ["ship-service-level", "Ship Service Level"],
        "sales_channel":      ["Sales Channel", "Sales Channel "],  # note trailing space in original
        "size":               ["Size"],
    },

    # ── Future marketplaces ────────────────────────────────────────────────────
    # These are stub entries. Populate each dict once real sample exports from
    # that marketplace are available and can be tested against actual headers.
    # Do not invent aliases for untested marketplace formats.

    "flipkart": {
        # TODO: populate from real Flipkart seller report headers
    },

    "meesho": {
        # TODO: populate from real Meesho seller report headers
    },

    "myntra": {
        # TODO: populate from real Myntra seller report headers
    },
}
