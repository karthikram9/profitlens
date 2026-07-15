"""
Data processing service — porting of preprocessing.py and feature_engineering.py.

Applies the locked business assumptions exactly:
  - Estimated_COGS   = 60%  of Amount
  - Platform_Fee     = 10%  of Amount
  - GST              = 18%  of Amount
  - Shipping_Cost    = tiered (0 if Cancelled, 40 if <500, 70 if <1000, else 100)
  - Return_Loss      = ₹140 if order contains a return/rejection, else 0
  - Estimated_Profit = Amount - COGS - Platform_Fee - Shipping_Cost - GST - Return_Loss

Module 8 will make these configurable.  This module MUST NOT change them.

Input: a pandas DataFrame whose columns have already been renamed to the
internal canonical names (via the confirmed column mapping).

Output: the same DataFrame with the derived financial columns appended.
"""

import logging
import re
import uuid
from datetime import date
from typing import Dict, List

import pandas as pd

logger = logging.getLogger(__name__)

# ── Business constants (locked — do not change here; Module 8 owns config) ────
COGS_RATE = 0.60
PLATFORM_FEE_RATE = 0.10
GST_RATE = 0.18
RETURN_LOSS_INR = 140.0

TIERED_SHIPPING_CANCELLED = 0.0
TIERED_SHIPPING_LOW = 40.0       # Amount < 500
TIERED_SHIPPING_MID = 70.0       # 500 <= Amount < 1000
TIERED_SHIPPING_HIGH = 100.0     # Amount >= 1000

# Regex patterns for status classification
RETURN_STATUS_PATTERN = re.compile(
    r"return|returning|rejected", flags=re.IGNORECASE
)
CANCELLED_STATUS_PATTERN = re.compile(r"cancel", flags=re.IGNORECASE)

# ── Category normalisation map (ported from feature_engineering.py) ────────────
CATEGORY_NORMALISATION: Dict[str, str] = {
    "set": "Set",
    "kurta": "Kurta",
    "western dress": "Western Dress",
    "top": "Top",
    "ethnic dress": "Ethnic Dress",
    "blouse": "Blouse",
    "saree": "Saree",
    "dupatta": "Dupatta",
    "bottom": "Bottom",
    "leggings & churidars": "Leggings & Churidars",
    "legging & churidar": "Leggings & Churidars",
}


def _normalise_category(series: pd.Series) -> pd.Series:
    """Standardise category names to match training data distribution."""
    def _norm(val: str) -> str:
        if pd.isna(val):
            return "Unknown"
        key = str(val).strip().lower()
        return CATEGORY_NORMALISATION.get(key, str(val).strip())
    return series.apply(_norm)


def _compute_shipping_cost(row: pd.Series) -> float:
    """Tiered shipping logic ported from feature_engineering.py."""
    status = str(row.get("status", "")).strip()
    if CANCELLED_STATUS_PATTERN.search(status):
        return TIERED_SHIPPING_CANCELLED
    amount = float(row.get("amount", 0) or 0)
    if amount < 500:
        return TIERED_SHIPPING_LOW
    elif amount < 1000:
        return TIERED_SHIPPING_MID
    else:
        return TIERED_SHIPPING_HIGH


def _compute_return_loss(status: str) -> float:
    """Return ₹140 for returned/rejected orders, else 0."""
    if pd.isna(status):
        return 0.0
    return RETURN_LOSS_INR if RETURN_STATUS_PATTERN.search(str(status)) else 0.0


def _compute_return_flag(status: str) -> int:
    """1 if order was returned/rejected, else 0. Null stays null for not-shipped rows."""
    if pd.isna(status):
        return 0
    return 1 if RETURN_STATUS_PATTERN.search(str(status)) else 0


def _parse_date(val) -> date | None:
    """Attempt to parse a date value; return None on failure."""
    if pd.isna(val):
        return None
    try:
        return pd.to_datetime(val, dayfirst=False, errors="coerce").date()
    except Exception:
        return None


def _parse_bool(val) -> bool | None:
    """Parse B2B flag — handles 'TRUE'/'FALSE' strings and booleans."""
    if pd.isna(val):
        return None
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in ("true", "1", "yes")


def _parse_qty(val) -> int | None:
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def process_dataframe(
    df: pd.DataFrame,
    upload_id: str,
    user_id: str,
) -> Dict:
    """
    Clean, enrich, and compute financial metrics for a mapped DataFrame.

    Parameters
    ----------
    df : pandas.DataFrame
        DataFrame with columns renamed to internal canonical names via the
        confirmed column mapping. Must contain all REQUIRED_INTERNAL_FIELDS.
    upload_id : str
        UUID of the Upload record this data belongs to.
    user_id : str
        UUID of the User who owns this data.

    Returns
    -------
    dict with keys:
        "rows"          : list[dict]  — processed rows ready for bulk insert
        "row_count_raw" : int         — total rows in input
        "row_count_processed" : int   — rows that will be inserted
        "row_count_excluded"  : int   — rows dropped during processing
        "exclusion_reasons"   : dict  — {reason: count}
        "categories_found"    : list[str]
        "date_min"            : str | None
        "date_max"            : str | None
    """
    logger.info(
        "data_processing_service: starting processing upload_id=%s rows=%d",
        upload_id, len(df)
    )

    row_count_raw = len(df)
    exclusion_reasons: Dict[str, int] = {}

    # ── 1. Drop unnamed / fully-empty columns ──────────────────────────────────
    df = df.copy()
    df = df.loc[:, ~df.columns.str.match(r"^unnamed:\s*\d+", case=False)]

    # ── 2. Drop rows missing critical fields ───────────────────────────────────
    for field in ("order_id", "amount", "status"):
        before = len(df)
        df = df[df[field].notna() & (df[field].astype(str).str.strip() != "")]
        dropped = before - len(df)
        if dropped:
            exclusion_reasons[f"missing_{field}"] = exclusion_reasons.get(f"missing_{field}", 0) + dropped

    # ── 3. Parse and coerce types ──────────────────────────────────────────────
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
    df["qty"] = df["qty"].apply(_parse_qty) if "qty" in df.columns else 1
    df["b2b"] = df["b2b"].apply(_parse_bool) if "b2b" in df.columns else False
    df["date_parsed"] = df["date"].apply(_parse_date) if "date" in df.columns else None

    # ── 4. Category normalisation ──────────────────────────────────────────────
    if "category" in df.columns:
        df["category"] = _normalise_category(df["category"])

    # ── 5. Financial metrics ───────────────────────────────────────────────────
    df["estimated_cogs"] = df["amount"] * COGS_RATE
    df["platform_fee"] = df["amount"] * PLATFORM_FEE_RATE
    df["gst"] = df["amount"] * GST_RATE
    df["shipping_cost"] = df.apply(_compute_shipping_cost, axis=1)
    df["return_loss"] = df["status"].apply(_compute_return_loss)
    df["estimated_profit"] = (
        df["amount"]
        - df["estimated_cogs"]
        - df["platform_fee"]
        - df["shipping_cost"]
        - df["gst"]
        - df["return_loss"]
    )
    df["return_flag"] = df["status"].apply(_compute_return_flag)

    # ── 6. Build output rows ───────────────────────────────────────────────────
    rows: List[dict] = []
    for _, row in df.iterrows():
        rows.append({
            "id": str(uuid.uuid4()),
            "upload_id": upload_id,
            "user_id": user_id,
            "order_id": str(row.get("order_id", "")).strip() or None,
            "date": row["date_parsed"],
            "status": str(row.get("status", "")).strip() or None,
            "fulfilment": str(row.get("fulfilment", "")).strip() or None,
            "ship_service_level": str(row.get("ship_service_level", "")).strip() or None,
            "category": str(row.get("category", "")).strip() or None,
            "sku": str(row.get("sku", "")).strip() or None,
            "qty": row.get("qty"),
            "amount": float(row["amount"]),
            "ship_state": str(row.get("ship_state", "")).strip() or None,
            "ship_city": str(row.get("ship_city", "")).strip() or None,
            "b2b": row.get("b2b"),
            "estimated_cogs": round(float(row["estimated_cogs"]), 4),
            "platform_fee": round(float(row["platform_fee"]), 4),
            "shipping_cost": round(float(row["shipping_cost"]), 4),
            "gst": round(float(row["gst"]), 4),
            "return_loss": round(float(row["return_loss"]), 4),
            "estimated_profit": round(float(row["estimated_profit"]), 4),
            "return_flag": int(row["return_flag"]),
            "risk_probability": None,   # filled by risk_scoring_service
            "used_fallback": None,      # filled by risk_scoring_service
        })

    row_count_processed = len(rows)
    row_count_excluded = row_count_raw - row_count_processed

    # ── 7. Aggregate metadata ──────────────────────────────────────────────────
    dates = [r["date"] for r in rows if r["date"] is not None]
    date_min = str(min(dates)) if dates else None
    date_max = str(max(dates)) if dates else None
    categories_found = sorted({r["category"] for r in rows if r["category"]})

    logger.info(
        "data_processing_service: complete upload_id=%s processed=%d excluded=%d",
        upload_id, row_count_processed, row_count_excluded
    )

    return {
        "rows": rows,
        "row_count_raw": row_count_raw,
        "row_count_processed": row_count_processed,
        "row_count_excluded": row_count_excluded,
        "exclusion_reasons": exclusion_reasons,
        "categories_found": categories_found,
        "date_min": date_min,
        "date_max": date_max,
    }
