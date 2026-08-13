#!/usr/bin/env python3
"""
collect_crash_logs.py — pull crash / error logs from an OMMHA device over ADB.

Connect a phone running the app (USB, or WiFi via `adb connect`), then run this
on the laptop. Captures, into ./crashlogs/<timestamp>_<serial>/:

  - logcat-app.log      app-process logcat (the app's own JS/native output)
  - logcat-full.log     full device logcat buffer dump (context around a crash)
  - js-errors.log       only the React Native JS errors / global-handler lines
  - crashes.log         FATAL EXCEPTION / native signal / ANR lines
  - tombstones/         native crash tombstones pulled from the device (if root)
  - device-info.txt     model, android version, app versionName/versionCode

Modes:
  --once    dump current buffers and exit (default)
  --watch   stream live; keep running until Ctrl-C, writing as events arrive

Examples:
  python collect_crash_logs.py
  python collect_crash_logs.py --watch
  python collect_crash_logs.py --serial 192.168.1.50:5555 --watch
  python collect_crash_logs.py --connect 192.168.1.50:5555 --watch
"""

import argparse
import datetime
import os
import re
import shutil
import signal
import subprocess
import sys

PACKAGE = "id.atlaskeswa.mobile"

# logcat tags worth keeping for a React Native app crash investigation.
JS_TAGS = ("ReactNativeJS", "ReactNative", "ExpoModulesCore")
# Substrings that mark a real crash / fatal condition.
CRASH_MARKERS = (
    "FATAL EXCEPTION",
    "AndroidRuntime",
    "ANR in",
    "signal 11", "signal 6", "SIGSEGV", "SIGABRT",
    "UnsatisfiedLinkError",
    "libhermes",
    "[GlobalError]",
    "[UnhandledRejection]",
)


def run(cmd, **kw):
    """Run a command, return CompletedProcess. Never raises on non-zero."""
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def adb_base(serial):
    base = ["adb"]
    if serial:
        base += ["-s", serial]
    return base


def ensure_adb():
    if shutil.which("adb") is None:
        sys.exit(
            "ERROR: `adb` not found on PATH.\n"
            "Install Android platform-tools:\n"
            "  macOS:   brew install android-platform-tools\n"
            "  Linux:   sudo apt install android-tools-adb\n"
            "  Windows: choco install adb   (or unzip platform-tools)"
        )


def list_devices():
    out = run(["adb", "devices"]).stdout.strip().splitlines()[1:]
    return [ln.split("\t")[0] for ln in out if "\tdevice" in ln]


def pick_serial(requested):
    devices = list_devices()
    if requested:
        if requested not in devices:
            sys.exit(f"ERROR: device '{requested}' not connected. Online: {devices or 'none'}")
        return requested
    if not devices:
        sys.exit(
            "ERROR: no device connected.\n"
            "  USB:  enable USB debugging, plug in, accept the prompt.\n"
            "  WiFi: adb tcpip 5555 (once via USB), then\n"
            "        python collect_crash_logs.py --connect <phone-ip>:5555"
        )
    if len(devices) > 1:
        sys.exit(f"ERROR: multiple devices: {devices}. Pass --serial <one>.")
    return devices[0]


def device_info(adb, app_pid):
    def prop(p):
        return run(adb + ["shell", "getprop", p]).stdout.strip()
    lines = [
        f"collected_at   {datetime.datetime.now().isoformat(timespec='seconds')}",
        f"model          {prop('ro.product.manufacturer')} {prop('ro.product.model')}",
        f"android_release {prop('ro.build.version.release')} (API {prop('ro.build.version.sdk')})",
        f"abi            {prop('ro.product.cpu.abi')}  abilist={prop('ro.product.cpu.abilist')}",
        f"package        {PACKAGE}",
        f"app_pid        {app_pid or 'NOT RUNNING'}",
    ]
    # App version via dumpsys (works without app running).
    dump = run(adb + ["shell", "dumpsys", "package", PACKAGE]).stdout
    ver = re.search(r"versionName=(\S+)", dump)
    code = re.search(r"versionCode=(\d+)", dump)
    lines.append(f"app_version    {ver.group(1) if ver else '?'} (versionCode {code.group(1) if code else '?'})")
    return "\n".join(lines) + "\n"


def get_app_pid(adb):
    out = run(adb + ["shell", "pidof", PACKAGE]).stdout.strip()
    return out.split()[0] if out else None


def filter_lines(text, markers):
    return "\n".join(ln for ln in text.splitlines() if any(m in ln for m in markers))


def collect_once(adb, outdir):
    app_pid = get_app_pid(adb)

    with open(os.path.join(outdir, "device-info.txt"), "w") as f:
        f.write(device_info(adb, app_pid))

    # Full buffer dump (-d = dump and exit). Include crash + main + system buffers.
    full = run(adb + ["logcat", "-d", "-b", "all", "-v", "threadtime"]).stdout
    with open(os.path.join(outdir, "logcat-full.log"), "w") as f:
        f.write(full)

    # App-process-only logcat if the app is running (--pid). Else fall back to tag filter.
    if app_pid:
        app = run(adb + ["logcat", "-d", "-v", "threadtime", "--pid", app_pid]).stdout
    else:
        app = "\n".join(
            ln for ln in full.splitlines() if any(t in ln for t in JS_TAGS)
        )
    with open(os.path.join(outdir, "logcat-app.log"), "w") as f:
        f.write(app)

    with open(os.path.join(outdir, "js-errors.log"), "w") as f:
        f.write(filter_lines(full, JS_TAGS + ("[GlobalError]", "[UnhandledRejection]")))

    crashes = filter_lines(full, CRASH_MARKERS)
    with open(os.path.join(outdir, "crashes.log"), "w") as f:
        f.write(crashes)

    pull_tombstones(adb, outdir)

    print(f"\nSaved to: {outdir}")
    if crashes.strip():
        print("\n--- CRASH / FATAL lines found ---")
        print(crashes[:4000])
    else:
        print("\nNo FATAL/crash markers in the current buffer.")
        print("If the crash already happened and scrolled off, reproduce it with")
        print("--watch running, or it may need a native tombstone (rooted device).")


def pull_tombstones(adb, outdir):
    """Native crash tombstones. Needs root (`adb root`) on most devices."""
    ls = run(adb + ["shell", "ls", "/data/tombstones/"])
    if ls.returncode != 0 or not ls.stdout.strip() or "Permission denied" in ls.stderr:
        return
    tdir = os.path.join(outdir, "tombstones")
    os.makedirs(tdir, exist_ok=True)
    for name in ls.stdout.split():
        run(adb + ["pull", f"/data/tombstones/{name}", tdir])
    print(f"Pulled native tombstones → {tdir}")


def collect_watch(adb, outdir):
    app_pid = get_app_pid(adb)
    with open(os.path.join(outdir, "device-info.txt"), "w") as f:
        f.write(device_info(adb, app_pid))

    # Clear buffer so we only see fresh events, then stream live.
    run(adb + ["logcat", "-c"])
    print(f"Watching live logcat for {PACKAGE}. Reproduce the crash now. Ctrl-C to stop.")
    print(f"Writing → {outdir}\n")

    cmd = adb + ["logcat", "-v", "threadtime", "-b", "all"]
    if app_pid:
        cmd += ["--pid", app_pid]

    app_f = open(os.path.join(outdir, "logcat-app.log"), "w")
    crash_f = open(os.path.join(outdir, "crashes.log"), "w")
    js_f = open(os.path.join(outdir, "js-errors.log"), "w")

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True, bufsize=1)

    def stop(*_):
        proc.terminate()
    signal.signal(signal.SIGINT, stop)

    try:
        for line in proc.stdout:
            app_f.write(line); app_f.flush()
            if any(m in line for m in CRASH_MARKERS):
                crash_f.write(line); crash_f.flush()
                print("CRASH:", line.rstrip())
            if any(t in line for t in JS_TAGS) or "[GlobalError]" in line:
                js_f.write(line); js_f.flush()
    finally:
        proc.wait()
        for fh in (app_f, crash_f, js_f):
            fh.close()
        pull_tombstones(adb, outdir)
        print(f"\nStopped. Logs in {outdir}")


def main():
    ap = argparse.ArgumentParser(description="Collect OMMHA app crash logs over ADB.")
    ap.add_argument("--serial", help="adb device serial (or ip:port). Auto if only one.")
    ap.add_argument("--connect", metavar="IP:PORT", help="adb connect <ip:port> first (WiFi).")
    ap.add_argument("--watch", action="store_true", help="stream live until Ctrl-C.")
    ap.add_argument("--outdir", default="crashlogs", help="output base dir (default: crashlogs)")
    args = ap.parse_args()

    ensure_adb()
    if args.connect:
        print(run(["adb", "connect", args.connect]).stdout.strip())

    serial = pick_serial(args.serial)
    adb = adb_base(serial)

    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    safe_serial = re.sub(r"[^\w.-]", "_", serial)
    outdir = os.path.join(args.outdir, f"{ts}_{safe_serial}")
    os.makedirs(outdir, exist_ok=True)

    print(f"Device: {serial}")
    if args.watch:
        collect_watch(adb, outdir)
    else:
        collect_once(adb, outdir)


if __name__ == "__main__":
    main()
