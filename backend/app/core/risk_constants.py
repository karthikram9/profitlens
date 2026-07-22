"""
Core risk scoring and recommendation constants.
"""

# Risk tier thresholds
RISK_TIER_HIGH_THRESHOLD = 0.5
RISK_TIER_MEDIUM_THRESHOLD = 0.2

# Sample-size floors
MIN_HEATMAP_ORDER_COUNT = 5
MIN_RECOMMENDATION_ORDER_COUNT = 5

# Recommendation inclusion threshold (absolute risk probability gap: Category Avg Risk - Dataset Avg Risk >= 0.05)
RECOMMENDATION_MIN_RISK_GAP_ABSOLUTE = 0.05

# Recommendation priority classification rules
RECOMMENDATION_HIGH_PRIORITY_RISK_GAP = 0.15
RECOMMENDATION_HIGH_PRIORITY_MIN_ORDERS = 20

# Standard return loss per returned order (INR)
DEFAULT_RETURN_LOSS_AMOUNT = 140.0
