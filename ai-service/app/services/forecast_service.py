import os
import datetime
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from typing import List, Dict, Any, Tuple

# Setup model storage directory
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def get_vietnam_holidays(year: int) -> List[datetime.date]:
    """
    Returns a list of fixed Vietnam public holidays.
    Lunar New Year is complex to calculate without external libs, 
    so we focus on the main Gregorian calendar holidays.
    """
    return [
        datetime.date(year, 1, 1),   # New Year's Day
        datetime.date(year, 4, 30),  # Reunification Day
        datetime.date(year, 5, 1),   # International Workers' Day
        datetime.date(year, 9, 2),   # National Day
    ]

def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts features for modeling.
    df must contain columns: ['CourtID', 'Date', 'HourStart']
    """
    # Convert date if it's string
    df['Date'] = pd.to_datetime(df['Date']).dt.date
    df['DateObj'] = pd.to_datetime(df['Date'])
    
    # Feature 1: Day of week (0 = Monday, 6 = Sunday)
    df['DayOfWeek'] = df['DateObj'].dt.dayofweek
    
    # Feature 2: Hour of day
    df['Hour'] = df['HourStart'].astype(int)
    
    # Feature 3: Is Weekend
    df['IsWeekend'] = df['DayOfWeek'].apply(lambda x: 1 if x >= 5 else 0)
    
    # Feature 4: Is Holiday
    df['IsHoliday'] = df['Date'].apply(lambda d: 1 if d in get_vietnam_holidays(d.year) else 0)
    
    # Drop temporary column
    df = df.drop(columns=['DateObj'])
    return df

def clean_and_prepare_data(bookings_list: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Converts list of raw bookings into a cleaned DataFrame with hourly slots.
    Ignores Cancelled or NoShow bookings.
    """
    if not bookings_list:
        return pd.DataFrame(columns=['CourtID', 'Date', 'HourStart', 'IsBooked'])
        
    df_raw = pd.DataFrame(bookings_list)
    
    # Clean: Filter out Cancelled and NoShow
    valid_statuses = ['Paid', 'Confirmed', 'CheckedIn', 'Completed']
    if 'Status' in df_raw.columns:
        df_raw = df_raw[df_raw['Status'].isin(valid_statuses)]
    
    # Convert fields
    df_raw['BookingDate'] = pd.to_datetime(df_raw['BookingDate']).dt.date
    
    # Generate all possible slots (CourtID x Date x HourStart)
    # to create positive (booked) and negative (available) training samples.
    all_records = []
    
    # Get unique courts and dates
    if df_raw.empty:
        return pd.DataFrame(columns=['CourtID', 'Date', 'HourStart', 'IsBooked'])
        
    unique_courts = df_raw['CourtID'].unique()
    unique_dates = df_raw['BookingDate'].unique()
    
    # Define operating hours (e.g. 5:00 to 23:00)
    operating_hours = list(range(5, 23))
    
    # Build a lookup set of actually booked slots
    booked_slots = set()
    for _, row in df_raw.iterrows():
        court_id = row['CourtID']
        b_date = row['BookingDate']
        
        # Parse StartTime and EndTime
        # StartTime can be '09:00:00' or datetime
        start_hour = int(str(row['StartTime']).split(':')[0])
        end_hour = int(str(row['EndTime']).split(':')[0])
        
        # Add hours to set
        for h in range(start_hour, end_hour):
            booked_slots.add((court_id, b_date, h))
            
    # Generate full matrix
    for court_id in unique_courts:
        for b_date in unique_dates:
            for h in operating_hours:
                is_booked = 1 if (court_id, b_date, h) in booked_slots else 0
                all_records.append({
                    'CourtID': court_id,
                    'Date': b_date,
                    'HourStart': h,
                    'IsBooked': is_booked
                })
                
    df_clean = pd.DataFrame(all_records)
    return df_clean

class ForecastModelManager:
    """
    Manages training, inference, and model versioning for court occupancy.
    Supports Cold Start strategy dynamically based on dataset size.
    """
    
    @staticmethod
    def get_latest_model() -> Tuple[Any, str, str]:
        """
        Loads the latest trained model from disk.
        Returns: (model_object, model_version, model_type)
        """
        models = [f for f in os.listdir(MODEL_DIR) if f.endswith(".pkl") and not f.endswith("_meta.pkl")]
        if not models:
            return None, "fallback_stat", "statistical"
            
        # Sort by creation time to get latest
        models.sort(key=lambda x: os.path.getmtime(MODEL_DIR / x), reverse=True)
        latest_model_name = models[0]
        
        try:
            model = joblib.load(MODEL_DIR / latest_model_name)
            meta = joblib.load(MODEL_DIR / latest_model_name.replace(".pkl", "_meta.pkl"))
            return model, meta.get("version", "v_latest"), meta.get("type", "ml")
        except Exception:
            return None, "fallback_stat", "statistical"

    @staticmethod
    def train_model(bookings_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Trains and versions the model. Applies the appropriate strategy depending on data availability.
        """
        df = clean_and_prepare_data(bookings_list)
        if df.empty or len(df['Date'].unique()) < 5:
            return {
                "status": "failed",
                "reason": "Not enough unique dates to train. Minimum 5 unique dates required.",
                "modelVersion": "fallback_stat",
                "modelType": "statistical"
            }
            
        # Extract features
        df_feat = extract_features(df)
        
        # Decide Strategy based on data size (Cold Start Strategy)
        unique_days = len(df_feat['Date'].unique())
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        model_version = f"model_v_{timestamp}"
        
        X_cols = ['DayOfWeek', 'Hour', 'IsWeekend', 'IsHoliday']
        X = df_feat[X_cols]
        y = df_feat['IsBooked'] * 100.0  # Convert to percentage probability (0-100)
        
        # Ghi nhận loại model
        if unique_days < 30:
            # Rule / Statistical Average approach
            # We save a dictionary containing historical means grouped by CourtID, DayOfWeek, Hour
            model_type = "statistical"
            stats_model = df_feat.groupby(['CourtID', 'DayOfWeek', 'Hour'])['IsBooked'].mean().to_dict()
            # Convert 0-1 fraction to 0-100 percentage
            stats_model = {k: v * 100.0 for k, v in stats_model.items()}
            
            joblib.dump(stats_model, MODEL_DIR / f"{model_version}.pkl")
            joblib.dump({"version": model_version, "type": model_type, "trained_at": str(datetime.datetime.now())}, 
                        MODEL_DIR / f"{model_version}_meta.pkl")
            
            # MAE Calculation
            preds = df_feat.apply(lambda r: stats_model.get((r['CourtID'], r['DayOfWeek'], r['Hour']), 50.0), axis=1)
            mae = np.mean(np.abs(y - preds))
            
        elif unique_days < 90:
            # Hybrid: simple Linear Regression model
            from sklearn.linear_model import LinearRegression
            model_type = "linear_regression"
            
            model = LinearRegression()
            model.fit(X, y)
            
            joblib.dump(model, MODEL_DIR / f"{model_version}.pkl")
            joblib.dump({"version": model_version, "type": model_type, "trained_at": str(datetime.datetime.now())}, 
                        MODEL_DIR / f"{model_version}_meta.pkl")
            
            preds = model.predict(X)
            preds = np.clip(preds, 0, 100)
            mae = np.mean(np.abs(y - preds))
            
        else:
            # Full ML approach: Random Forest Regressor
            from sklearn.ensemble import RandomForestRegressor
            model_type = "random_forest"
            
            model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
            model.fit(X, y)
            
            joblib.dump(model, MODEL_DIR / f"{model_version}.pkl")
            joblib.dump({"version": model_version, "type": model_type, "trained_at": str(datetime.datetime.now())}, 
                        MODEL_DIR / f"{model_version}_meta.pkl")
            
            preds = model.predict(X)
            mae = np.mean(np.abs(y - preds))
            
        return {
            "status": "success",
            "modelVersion": model_version,
            "modelType": model_type,
            "mae": float(mae),
            "recordsCount": len(df_feat),
            "daysCount": unique_days
        }

    @staticmethod
    def predict_occupancy(court_ids: List[int], target_date_str: str, historical_bookings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Predicts occupancy rate for each hour (5:00 - 22:00) of the target date for the specified court IDs.
        """
        # Parse target date
        target_date = datetime.datetime.strptime(target_date_str, "%Y-%m-%d").date()
        
        # Load latest model
        model, model_version, model_type = ForecastModelManager.get_latest_model()
        
        # Hours to predict
        operating_hours = list(range(5, 23))
        
        # Generate prediction data frame template
        pred_records = []
        for court_id in court_ids:
            for h in operating_hours:
                pred_records.append({
                    "CourtID": court_id,
                    "Date": target_date,
                    "HourStart": h
                })
                
        df_pred = pd.DataFrame(pred_records)
        df_pred_feat = extract_features(df_pred)
        
        predictions = []
        
        # Evaluate model prediction based on type
        if model_type == "statistical":
            # If fallback or statistical, model is a dict
            stats_dict = model if model else {}
            for _, row in df_pred_feat.iterrows():
                court_id = row['CourtID']
                dow = row['DayOfWeek']
                hr = row['Hour']
                
                # Get historical average, default to 40% if no historical data exists
                pred_prob = stats_dict.get((court_id, dow, hr), 40.0)
                
                predictions.append({
                    "CourtID": int(court_id),
                    "HourStart": int(hr),
                    "PredictedRate": float(np.round(pred_prob, 2))
                })
        else:
            # ML Model predictions
            X_cols = ['DayOfWeek', 'Hour', 'IsWeekend', 'IsHoliday']
            X = df_pred_feat[X_cols]
            
            # Predict
            raw_preds = model.predict(X)
            # Clip predictions to 0-100%
            raw_preds = np.clip(raw_preds, 0.0, 100.0)
            
            for idx, row in df_pred_feat.iterrows():
                predictions.append({
                    "CourtID": int(row['CourtID']),
                    "HourStart": int(row['Hour']),
                    "PredictedRate": float(np.round(raw_preds[idx], 2))
                })
                
        return predictions
