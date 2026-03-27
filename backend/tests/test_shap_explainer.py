"""Tests for SHAP-based feature importance explanations."""
import numpy as np

from app.services.shap_explainer import explain_with_shap


def _train_tiny_xgb():
    """Train a minimal XGBoost classifier for testing."""
    import xgboost as xgb
    rng = np.random.RandomState(42)
    X = rng.rand(100, 5)
    y = (X[:, 0] > 0.5).astype(int)
    model = xgb.XGBClassifier(n_estimators=10, max_depth=3, random_state=42)
    model.fit(X, y, verbose=False)
    return model


def test_shap_returns_contributions():
    model = _train_tiny_xgb()
    features = {"f0": 0.8, "f1": 0.3, "f2": 0.5, "f3": 0.1, "f4": 0.9}
    result = explain_with_shap(model, features, list(features.keys()), "test")
    assert len(result) > 0
    assert all("feature" in r for r in result)
    assert all("value" in r for r in result)
    assert all("contribution" in r for r in result)
    assert all("description" in r for r in result)


def test_shap_sorted_by_abs_contribution():
    model = _train_tiny_xgb()
    features = {"f0": 0.8, "f1": 0.3, "f2": 0.5, "f3": 0.1, "f4": 0.9}
    result = explain_with_shap(model, features, list(features.keys()), "test")
    if len(result) > 1:
        abs_contribs = [abs(r["contribution"]) for r in result]
        assert abs_contribs == sorted(abs_contribs, reverse=True)


def test_shap_returns_empty_on_none_model():
    result = explain_with_shap(None, {"f": 1.0}, ["f"], "test")
    assert result == []


def test_shap_max_10_features():
    model = _train_tiny_xgb()
    features = {f"f{i}": float(i) / 5 for i in range(5)}
    result = explain_with_shap(model, features, list(features.keys()), "test")
    assert len(result) <= 10


def test_rule_based_fallback_still_works():
    """Verify the existing rule-based explainer still works."""
    from app.services.explainability_service import explain_flood
    features = {"precip_24h": 80, "humidity": 90, "soil_moisture": 0.8}
    result = explain_flood(features)
    assert len(result) > 0
    assert any(r["feature"] == "precip_24h" for r in result)
