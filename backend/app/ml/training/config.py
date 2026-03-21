"""Training configuration: date ranges, API params, hyperparameters, label thresholds."""

from pathlib import Path

# ---------------------------------------------------------------------------
# Date range (3 years of daily data)
# ---------------------------------------------------------------------------
START_DATE = "2023-01-01"
END_DATE = "2025-12-31"

# ---------------------------------------------------------------------------
# Data directories
# ---------------------------------------------------------------------------
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "historical"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
SAVED_MODELS_DIR = Path(__file__).parent.parent / "saved_models"

# ---------------------------------------------------------------------------
# Open-Meteo archive API -- extended daily parameters
# ---------------------------------------------------------------------------
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

ARCHIVE_DAILY_PARAMS = (
    "temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
    "precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,"
    "relative_humidity_2m_mean,relative_humidity_2m_min,"
    "surface_pressure_mean,soil_moisture_0_to_7cm_mean,"
    "dew_point_2m_mean,cloud_cover_mean,"
    "uv_index_max,et0_fao_evapotranspiration"
)

# ---------------------------------------------------------------------------
# Domain-threshold label constants
# ---------------------------------------------------------------------------

# Flood: precip_24h > 30mm OR (precip > 15mm AND soil_moisture > 0.5)
FLOOD_PRECIP_HEAVY = 30.0  # mm
FLOOD_PRECIP_MODERATE = 15.0  # mm
FLOOD_SOIL_SATURATED = 0.5  # fraction

# Heatwave: 3+ consecutive days with max > 35C AND min > 20C
HEATWAVE_MAX_THRESHOLD = 35.0  # °C
HEATWAVE_MIN_THRESHOLD = 20.0  # °C
HEATWAVE_CONSECUTIVE_DAYS = 3

# Wildfire: FWI > 25 AND consecutive_dry > 10 AND humidity_min < 35%
WILDFIRE_FWI_THRESHOLD = 25.0
WILDFIRE_DRY_DAYS_THRESHOLD = 10
WILDFIRE_HUMIDITY_THRESHOLD = 35.0  # %

# Drought (LSTM): SPEI_3m < -1.0 at day 91 of a 90-day sequence
DROUGHT_SPEI_THRESHOLD = -1.0
DROUGHT_SEQUENCE_LENGTH = 90

# ---------------------------------------------------------------------------
# Training hyperparameters
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
TEST_SPLIT = 0.2

# XGBoost (flood, heatwave)
XGB_N_ESTIMATORS = 200
XGB_MAX_DEPTH = 6
XGB_LEARNING_RATE = 0.1
XGB_EARLY_STOPPING = 20

# Random Forest (wildfire)
RF_N_ESTIMATORS = 200
RF_MAX_DEPTH = 10

# LightGBM (wildfire)
LGBM_N_ESTIMATORS = 200
LGBM_MAX_DEPTH = 8
LGBM_LEARNING_RATE = 0.1

# LSTM (drought)
LSTM_HIDDEN_SIZE = 64
LSTM_NUM_LAYERS = 2
LSTM_DROPOUT = 0.3
LSTM_BATCH_SIZE = 64
LSTM_EPOCHS = 50
LSTM_LR = 1e-3
LSTM_WEIGHT_DECAY = 1e-5
LSTM_PATIENCE = 10

# ---------------------------------------------------------------------------
# Forecast horizons (hours ahead)
# ---------------------------------------------------------------------------
FORECAST_HORIZONS = [6, 12, 24, 48, 72, 168]
TFT_MAX_PREDICTION_LENGTH = len(FORECAST_HORIZONS)  # 6 steps
TFT_MAX_ENCODER_LENGTH = 168  # 7 days of hourly lookback

# Temporal Fusion Transformer
TFT_HIDDEN_SIZE = 64
TFT_ATTENTION_HEAD_SIZE = 4
TFT_DROPOUT = 0.1
TFT_HIDDEN_CONTINUOUS_SIZE = 32
TFT_QUANTILES = [0.1, 0.5, 0.9]
TFT_BATCH_SIZE = 128
TFT_EPOCHS = 100
TFT_LR = 1e-3
TFT_PATIENCE = 15
TFT_GRADIENT_CLIP = 0.1

# Graph Attention Network (spatial refinement)
GNN_HIDDEN_CHANNELS = 32
GNN_NUM_LAYERS = 3
GNN_DROPOUT = 0.2
GNN_LR = 5e-4
GNN_EPOCHS = 50

# Feature flag
ENABLE_TFT_FORECASTS = True
