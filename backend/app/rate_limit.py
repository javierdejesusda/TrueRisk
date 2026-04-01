"""Shared rate limiter instance -- imported by main.py and API routers."""

from slowapi import Limiter

from app.security.real_ip import get_real_ip

limiter = Limiter(key_func=get_real_ip, default_limits=["200/minute"])
