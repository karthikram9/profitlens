"""
Recommendation service — rule-based, deterministic recommendation engine for Module 7.

Rules:
1. Only evaluate Merchant-fulfilled orders (where risk_probability IS NOT NULL).
2. Filter to categories with orderCount >= MIN_RECOMMENDATION_ORDER_COUNT (5).
3. Qualify categories where (category_avg_risk - dataset_avg_risk) >= RECOMMENDATION_MIN_RISK_GAP_ABSOLUTE (0.05).
4. Priority: "High" if risk_gap >= 0.15 AND order_count >= 20; "Medium" otherwise.
5. Expected Improvement is grounded in ACTUAL historical return loss (₹140 * actual return rate gap), NOT predicted risk probabilities.
"""

import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.db.models import Order
from app.core.risk_constants import (
    MIN_RECOMMENDATION_ORDER_COUNT,
    RECOMMENDATION_MIN_RISK_GAP_ABSOLUTE,
    RECOMMENDATION_HIGH_PRIORITY_RISK_GAP,
    RECOMMENDATION_HIGH_PRIORITY_MIN_ORDERS,
    DEFAULT_RETURN_LOSS_AMOUNT,
    RISK_TIER_HIGH_THRESHOLD,
)

logger = logging.getLogger(__name__)

# Category-agnostic actionable suggestions template list
ACTION_TEMPLATES = [
    "Review sizing guides and customer feedback for size/fit inaccuracies on product detail pages.",
    "Verify product image accuracy and color representations to align customer expectations before shipment.",
    "Inspect packaging and transit durability for this category to minimize damage-in-transit returns.",
    "Evaluate pricing and competitor positioning to ensure value expectations match product quality.",
    "Audit fulfillment quality and pre-shipment item inspection for this category segment.",
]


def generate_recommendations(db: Session, upload_id: str) -> List[Dict[str, Any]]:
    """
    Generates rule-based recommendations for categories exhibiting elevated return risk.
    """
    # 1. Base query for Merchant-fulfilled orders (where risk_probability is not null)
    base_query = db.query(Order).filter(
        Order.upload_id == upload_id,
        Order.risk_probability.isnot(None),
    )

    # Count total scored merchant orders
    total_scored_orders = base_query.count()
    if total_scored_orders < MIN_RECOMMENDATION_ORDER_COUNT:
        return []

    # Calculate dataset-wide average risk probability and dataset-wide actual return rate
    avg_risk_row = db.query(
        func.avg(Order.risk_probability).label("avg_risk"),
        func.sum(case((Order.return_flag == 1, 1), else_=0)).label("total_returns"),
        func.sum(case((Order.return_loss.isnot(None), Order.return_loss), else_=0)).label("total_return_loss"),
    ).filter(
        Order.upload_id == upload_id,
        Order.risk_probability.isnot(None),
    ).first()

    dataset_avg_risk = float(avg_risk_row.avg_risk or 0.0) if avg_risk_row else 0.0
    total_returns = int(avg_risk_row.total_returns or 0) if avg_risk_row else 0
    dataset_actual_return_rate = (total_returns / total_scored_orders) if total_scored_orders > 0 else 0.0

    # 2. Group by category for Merchant-fulfilled orders
    cat_query = db.query(
        Order.category.label("category"),
        func.count(Order.id).label("order_count"),
        func.avg(Order.risk_probability).label("avg_risk"),
        func.sum(case((Order.risk_probability >= RISK_TIER_HIGH_THRESHOLD, 1), else_=0)).label("high_risk_count"),
        func.sum(case((Order.return_flag == 1, 1), else_=0)).label("returns_count"),
        func.sum(case((Order.return_loss.isnot(None), Order.return_loss), else_=0)).label("return_loss_sum"),
    ).filter(
        Order.upload_id == upload_id,
        Order.risk_probability.isnot(None),
        Order.category.isnot(None),
    ).group_by(Order.category).all()

    recommendations = []
    action_idx = 0

    for row in cat_query:
        category_name = row.category or "Uncategorized"
        order_count = int(row.order_count or 0)
        avg_risk = float(row.avg_risk or 0.0)
        high_risk_count = int(row.high_risk_count or 0)
        returns_count = int(row.returns_count or 0)
        return_loss_sum = float(row.return_loss_sum or 0.0)

        # Check sample size floor
        if order_count < MIN_RECOMMENDATION_ORDER_COUNT:
            continue

        risk_gap = avg_risk - dataset_avg_risk

        # Check qualification threshold: absolute gap >= 0.05
        if risk_gap < RECOMMENDATION_MIN_RISK_GAP_ABSOLUTE:
            continue

        # Priority rule
        is_high_priority = (
            risk_gap >= RECOMMENDATION_HIGH_PRIORITY_RISK_GAP and
            order_count >= RECOMMENDATION_HIGH_PRIORITY_MIN_ORDERS
        )
        priority = "High" if is_high_priority else "Medium"

        # Calculate historical actual return rate
        category_actual_return_rate = (returns_count / order_count) if order_count > 0 else 0.0

        # Calculate Expected Improvement (rupee savings) grounded strictly in historical return loss math
        rate_diff = max(0.0, category_actual_return_rate - dataset_actual_return_rate)
        expected_savings = round(rate_diff * order_count * DEFAULT_RETURN_LOSS_AMOUNT, 2)

        # Pick category-agnostic action suggestion
        suggested_action = ACTION_TEMPLATES[action_idx % len(ACTION_TEMPLATES)]
        action_idx += 1

        rec_item = {
            "id": f"rec_{category_name.lower().replace(' ', '_')}",
            "category": category_name,
            "reason": f"{category_name} has an average return risk of {avg_risk * 100:.1f}%, exceeding the dataset average of {dataset_avg_risk * 100:.1f}% by {risk_gap * 100:.1f} percentage points.",
            "evidence": f"{order_count} merchant orders scored, with {high_risk_count} order(s) ({ (high_risk_count / order_count * 100):.1f}%) in the High risk tier.",
            "businessImpact": f"Historical return loss incurred in this category: ₹{return_loss_sum:,.2f} ({returns_count} returned order(s)).",
            "suggestedAction": suggested_action,
            "priority": priority,
            "expectedImprovement": f"Lowering this category's return rate to the store average could recover ~₹{expected_savings:,.2f} in return losses.",
        }
        recommendations.append(rec_item)

    # Sort recommendations by Priority (High first), then by risk gap descending
    recommendations.sort(
        key=lambda r: (0 if r["priority"] == "High" else 1, -float(r["reason"].split("%")[0].split()[-1]))
    )

    return recommendations
