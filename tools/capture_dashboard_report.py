from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports" / "dashboard_ommha" / "screenshots"
PAGES = [
    ("00-halaman-login.png", "/login"),
    ("01-dashboard-ringkasan.png", "/dashboard"),
    ("02-indikator-utama.png", "/dashboard/indicators"),
    ("03-manajemen-survei.png", "/dashboard/survey"),
    ("04-entri-survei-baru.png", "/survey/new"),
    ("05-pengajuan-tertunda.png", "/dashboard/survey/pending"),
    ("06-unggah-massal.png", "/dashboard/survey/bulk-upload"),
    ("07-model-kuesioner.png", "/dashboard/survey/model-kuisioner"),
    ("08-template-survei.png", "/dashboard/survey/templates"),
    ("09-log-audit-survei.png", "/dashboard/survey/audit"),
    ("10-manajemen-layanan.png", "/dashboard/services"),
    ("11-peta-layanan.png", "/map"),
    ("12-pengguna.png", "/dashboard/users"),
    ("13-laporan-ekspor.png", "/reports/export"),
    ("14-bantuan.png", "/dashboard/help/user-guide"),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            args=["--disable-dev-shm-usage"],
        )
        context = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        page = context.new_page()
        page.goto("http://localhost:3000/login", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(OUT / PAGES[0][0]), full_page=False)
        page.get_by_label("Email").fill("report.capture@ommha.local")
        page.get_by_label("Kata Sandi").fill("ReportCapture2026!")
        page.get_by_role("button", name="Masuk", exact=True).click()
        page.wait_for_url("**/dashboard", timeout=60000)
        page.wait_for_timeout(2500)
        for filename, route in PAGES[1:]:
            page.goto(f"http://localhost:3000{route}", wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(4500)
            page.screenshot(path=str(OUT / filename), full_page=False)
            print(filename, page.url, page.title())
        browser.close()


if __name__ == "__main__":
    main()
