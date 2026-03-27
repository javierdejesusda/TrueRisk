"""Overnight TFT training runner with improved per-hazard configuration.

Prevents Windows sleep, regenerates the dataset, trains each hazard
with the appropriate mode (optimized for weak models, standard for strong),
and logs everything.

Usage:
    cd backend
    python train_overnight.py
"""

import ctypes
import os
import subprocess
import sys
import time

# Prevent Windows from sleeping during training
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001


def prevent_sleep():
    """Tell Windows to stay awake."""
    if sys.platform == "win32":
        ctypes.windll.kernel32.SetThreadExecutionState(
            ES_CONTINUOUS | ES_SYSTEM_REQUIRED
        )
        print("[POWER] Windows sleep prevention ENABLED")


def allow_sleep():
    """Re-enable normal sleep behavior."""
    if sys.platform == "win32":
        ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)
        print("[POWER] Windows sleep prevention DISABLED")


def run_cmd(description: str, args: list[str]) -> int:
    print(f"\n{'='*60}")
    print(f"STEP: {description}")
    print(f"Command: python {' '.join(args)}")
    print(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    step_start = time.time()
    result = subprocess.run(
        [sys.executable] + args,
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )

    elapsed_min = (time.time() - step_start) / 60
    status = "OK" if result.returncode == 0 else "FAILED"
    print(f"\n[{status}] {description} finished in {elapsed_min:.1f} min (exit code {result.returncode})")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    return result.returncode


# Per-hazard training config: (hazard, optimized?)
# Optimized for weak models (windstorm, flood, coldwave)
# Standard for strong models (drought, wildfire, heatwave)
TRAINING_SCHEDULE = [
    ("windstorm", True),
    ("flood", True),
    ("coldwave", True),
    ("drought", False),
    ("heatwave", False),
    ("wildfire", False),
]


def main():
    start = time.time()
    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tft_training_console.log")

    print(f"TFT Overnight Training Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python: {sys.executable}")
    print(f"CWD: {os.getcwd()}")
    print(f"Log: {log_path}")
    print("\nTraining schedule:")
    for hazard, opt in TRAINING_SCHEDULE:
        mode = "OPTIMIZED" if opt else "STANDARD"
        print(f"  {hazard:12s} -> {mode}")

    prevent_sleep()

    results: dict[str, str] = {}

    try:
        # Step 0: Regenerate TFT dataset with new features and score functions
        rc = run_cmd(
            "REGENERATE TFT DATASET",
            ["-m", "app.ml.training.prepare_tft_dataset"],
        )
        if rc != 0:
            print("\nFATAL: Dataset regeneration failed. Aborting training.")
            results["dataset"] = "FAILED"
            return

        results["dataset"] = "OK"

        # Train each hazard sequentially
        for hazard, optimized in TRAINING_SCHEDULE:
            mode = "OPTIMIZED" if optimized else "STANDARD"
            args = ["-m", "app.ml.training.train_tft", "--hazard", hazard]
            if optimized:
                args.append("--optimized")

            rc = run_cmd(
                f"TRAIN {hazard.upper()} [{mode}]",
                args,
            )
            results[hazard] = "OK" if rc == 0 else "FAILED"

            if rc != 0:
                print(f"\nWARNING: {hazard} training failed, continuing with next hazard...")

    finally:
        allow_sleep()

        elapsed_h = (time.time() - start) / 3600
        print(f"\n{'='*60}")
        print("OVERNIGHT TRAINING COMPLETE")
        print(f"{'='*60}")
        for key, status in results.items():
            print(f"  {key:12s}: {status}")
        failed = [k for k, v in results.items() if v == "FAILED"]
        if failed:
            print(f"\n  FAILURES: {failed}")
        else:
            print("\n  All steps succeeded!")
        print(f"  Total time: {elapsed_h:.1f} hours")
        print(f"  Finished: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")


if __name__ == "__main__":
    main()
