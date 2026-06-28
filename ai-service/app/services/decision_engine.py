from typing import List, Dict, Any

class AIDecisionEngine:
    """
    Core Intelligence layer.
    Coordinates inputs from occupancy forecasting, matches against threshold, 
    and applies a utility-based discount optimization model to recommend promotions.
    """

    @staticmethod
    def optimize_promotions(
        predictions: List[Dict[str, Any]], 
        threshold_occupancy: float = 50.0,
        base_price: float = 200000.0
    ) -> List[Dict[str, Any]]:
        """
        Processes forecasts, determines slots below threshold, and calculates optimal discount tier.
        
        Discount Tiers:
        - 0%: No discount
        - 10%: Low discount, expects small boost
        - 20%: Moderate discount, expects medium boost
        - 35%: High discount, expects high boost
        - 50%: Maximum discount, expects very high boost
        
        Model:
        - Utility (Expected Revenue) = NewOccupancyRate * BasePrice * (1 - DiscountRate)
        """
        
        # Boost in occupancy percentage points expected per discount tier
        boost_map = {
            10.0: 15.0,  # 10% discount boosts occupancy by 15% points
            20.0: 30.0,  # 20% discount boosts occupancy by 30% points
            35.0: 45.0,  # 35% discount boosts occupancy by 45% points
            50.0: 55.0   # 50% discount boosts occupancy by 55% points
        }
        
        discount_tiers = [0.0, 10.0, 20.0, 35.0, 50.0]
        recommendations = []
        
        # Group predictions by HourStart (or treat each slot individually)
        # In this case, we look at average occupancy rate across courts at each hour
        # to recommend club-wide happy hour promotions.
        df_preds = {}
        for pred in predictions:
            hour = pred["HourStart"]
            rate = pred["PredictedRate"]
            if hour not in df_preds:
                df_preds[hour] = []
            df_preds[hour].append(rate)
            
        # Optimize discount for each hour
        for hour, rates in df_preds.items():
            avg_rate = sum(rates) / len(rates)
            
            # 1. Compare against Threshold
            if avg_rate >= threshold_occupancy:
                # Occupancy is healthy, no promotion needed
                continue
                
            # 2. Select optimal discount using expected revenue optimization
            best_discount = 0.0
            best_expected_revenue = avg_rate * base_price / 100.0  # baseline expected revenue per court
            best_occupancy_new = avg_rate
            
            for d in [10.0, 20.0, 35.0, 50.0]:
                boost = boost_map[d]
                new_rate = min(avg_rate + boost, 100.0)
                
                # Expected revenue calculation: rate_pct * net_price
                expected_rev = (new_rate / 100.0) * base_price * (1 - d / 100.0)
                
                if expected_rev > best_expected_revenue:
                    best_expected_revenue = expected_rev
                    best_discount = d
                    best_occupancy_new = new_rate
                    
            if best_discount > 0.0:
                recommendations.append({
                    "HourStart": hour,
                    "PredictedRate": round(avg_rate, 2),
                    "Threshold": threshold_occupancy,
                    "SuggestedDiscount": best_discount,
                    "ExpectedOccupancyAfterPromo": round(best_occupancy_new, 2),
                    "ExpectedRevenueImprovement": round((best_expected_revenue - (avg_rate * base_price / 100.0)), 2)
                })
                
        return recommendations
