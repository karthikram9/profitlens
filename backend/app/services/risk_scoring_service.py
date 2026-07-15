"""
Risk scoring service — wraps ml/predictor.py for the upload pipeline.

Key rule (matches original model training scope):
  Score return risk ONLY for rows where fulfilment == "Merchant".
  Amazon-fulfilled rows get risk_probability = None, used_fallback = None.
  Never fabricate scores for out-of-scope rows.
"""

import logging
from typing import List, Dict, Any

import pandas as pd

from app.ml.predictor import predict_risk, model_loaded

logger = logging.getLogger(__name__)

MERCHANT_FULFILMENT_VALUE = "Merchant"


def apply_risk_scores(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Accepts the list of processed row dicts produced by data_processing_service
    and populates risk_probability and used_fallback for Merchant-fulfilled rows.

    Non-Merchant rows are left with risk_probability=None, used_fallback=None.

    Parameters
    ----------
    rows : list[dict]
        Output of data_processing_service.process_dataframe()["rows"].

    Returns
    -------
    The same list with risk_probability and used_fallback fields updated.
    """
    if not model_loaded:
        logger.warning(
            "risk_scoring_service: ML model not loaded — skipping risk scoring for all rows."
        )
        return rows

    if not rows:
        return rows

    # Split into Merchant and non-Merchant
    merchant_indices = [
        i for i, r in enumerate(rows)
        if str(r.get("fulfilment", "")).strip() == MERCHANT_FULFILMENT_VALUE
    ]

    if not merchant_indices:
        logger.info("risk_scoring_service: no Merchant-fulfilled rows — nothing to score.")
        return rows

    logger.info(
        "risk_scoring_service: scoring %d Merchant-fulfilled rows (of %d total).",
        len(merchant_indices), len(rows)
    )

    # Build a DataFrame matching the predictor's expected column names
    # predictor.py uses: Category, Amount, Qty, ship-state, B2B, Date
    merchant_rows = [rows[i] for i in merchant_indices]
    df_input = pd.DataFrame({
        "Category":   [r.get("category") for r in merchant_rows],
        "Amount":     [r.get("amount", 0) for r in merchant_rows],
        "Qty":        [r.get("qty", 1) for r in merchant_rows],
        "ship-state": [r.get("ship_state") for r in merchant_rows],
        "B2B":        [r.get("b2b", False) for r in merchant_rows],
        "Date":       [str(r.get("date")) if r.get("date") else None for r in merchant_rows],
    })

    try:
        result_df = predict_risk(df_input)
    except Exception as exc:
        logger.error(
            "risk_scoring_service: predict_risk() raised %s — risk scores will be null for this upload.",
            exc, exc_info=True
        )
        return rows

    # Write scores back into the original rows list
    for list_idx, result_row in zip(merchant_indices, result_df.itertuples()):
        rows[list_idx]["risk_probability"] = round(float(result_row.riskProbability), 6)
        rows[list_idx]["used_fallback"] = bool(result_row.usedFallback)

    non_merchant_count = len(rows) - len(merchant_indices)
    logger.info(
        "risk_scoring_service: done. scored=%d, skipped(non-merchant)=%d",
        len(merchant_indices), non_merchant_count
    )

    return rows
