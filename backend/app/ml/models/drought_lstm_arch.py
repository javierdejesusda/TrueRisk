"""Attention-enhanced LSTM architecture for drought risk prediction.

Adds multi-head self-attention between the LSTM encoder and classification
head.  A residual connection + LayerNorm stabilises training.
"""

import torch.nn as nn


class DroughtLSTM(nn.Module):
    def __init__(
        self,
        input_size: int = 6,
        hidden_size: int = 64,
        num_layers: int = 2,
        dropout: float = 0.3,
        num_heads: int = 4,
    ):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size, hidden_size, num_layers,
            batch_first=True, dropout=dropout,
        )
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=num_heads,
            batch_first=True,
            dropout=dropout,
        )
        self.layer_norm = nn.LayerNorm(hidden_size)
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1),
        )

    def forward(self, x):
        lstm_out, _ = self.lstm(x)  # (batch, seq, hidden)
        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        out = self.layer_norm(lstm_out + attn_out)  # residual connection
        return self.fc(out[:, -1, :]).squeeze(-1)  # last timestep
