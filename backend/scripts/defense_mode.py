"""
Keep one KILATIS GPU container running during a defense or demo, then go back to normal.

  uv run python scripts/defense_mode.py on       # 1 container always warm (billed the whole time)
  uv run python scripts/defense_mode.py off      # back to normal: scale to zero when idle
  uv run python scripts/defense_mode.py status   # how many containers are running now

This changes the live autoscaler without redeploying. A new `modal deploy` also
resets it to the normal values in modal_app.py. Needs your Modal login (`modal token`).
"""
from __future__ import annotations

import argparse
import sys

import modal

APP_NAME, FUNCTION_NAME = "kilatis-backend", "fastapi_app"
NORMAL_SCALEDOWN = 300            # must match scaledown_window in modal_app.py
L4_PER_HOUR = 0.000222 * 3600     # Modal list price for the L4 GPU alone (~$0.80/h), CPU/RAM extra


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["on", "off", "status"])
    ap.add_argument("--scaledown", type=int, default=1200,
                    help="idle seconds before an EXTRA container stops while defense mode is on (default 1200)")
    args = ap.parse_args()

    fn = modal.Function.from_name(APP_NAME, FUNCTION_NAME)

    if args.mode == "on":
        s = fn.update_autoscaler(min_containers=1, scaledown_window=args.scaledown)
        print(f"DEFENSE MODE ON: min_containers={s.min_containers}, scaledown_window={s.scaledown_window}s")
        print(f"One L4 container now stays up even when idle (about ${L4_PER_HOUR:.2f}/hour for the GPU, plus CPU/RAM).")
        print("Next: run scripts/warmup_modal.py. AFTER THE DEFENSE run: uv run python scripts/defense_mode.py off")
    elif args.mode == "off":
        s = fn.update_autoscaler(min_containers=0, scaledown_window=NORMAL_SCALEDOWN)
        print(f"DEFENSE MODE OFF: min_containers={s.min_containers}, scaledown_window={s.scaledown_window}s")
        print("The container will shut down after it has been idle for the scaledown window.")

    stats = fn.get_current_stats()
    print(f"Containers running now: {stats.num_total_runners}  (requests waiting: {stats.backlog})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
