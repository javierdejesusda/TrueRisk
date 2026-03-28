"""Tests for the attention-enhanced drought LSTM architecture."""

import torch
from app.ml.models.drought_lstm_arch import DroughtLSTM


class TestDroughtAttentionLSTM:
    def test_forward_pass_shape(self):
        """Output shape should be (batch_size,) for batch input."""
        model = DroughtLSTM(input_size=6, hidden_size=64, num_layers=2, dropout=0.0, num_heads=4)
        model.eval()
        x = torch.randn(4, 90, 6)
        with torch.no_grad():
            out = model(x)
        assert out.shape == (4,), f"Expected (4,), got {out.shape}"

    def test_single_sample(self):
        """Single sample should return scalar-like tensor."""
        model = DroughtLSTM(input_size=6, hidden_size=64, num_heads=4)
        model.eval()
        x = torch.randn(1, 90, 6)
        with torch.no_grad():
            out = model(x)
        assert out.shape == (1,)

    def test_attention_weights_extractable(self):
        """Should be able to extract attention weights for explainability."""
        model = DroughtLSTM(input_size=6, hidden_size=64, num_heads=4)
        model.eval()
        x = torch.randn(1, 90, 6)
        lstm_out, _ = model.lstm(x)
        _, attn_weights = model.attention(lstm_out, lstm_out, lstm_out, need_weights=True)
        assert attn_weights.shape[0] == 1  # batch
        assert attn_weights.shape[1] == 90  # seq_len (query)
        assert attn_weights.shape[2] == 90  # seq_len (key)

    def test_has_layer_norm(self):
        """Model should have LayerNorm for residual stabilization."""
        model = DroughtLSTM()
        assert hasattr(model, 'layer_norm')
        assert isinstance(model.layer_norm, torch.nn.LayerNorm)

    def test_backward_compatible_defaults(self):
        """Default construction should work without num_heads arg."""
        model = DroughtLSTM(input_size=6, hidden_size=64, num_layers=2, dropout=0.3)
        assert hasattr(model, 'attention')
