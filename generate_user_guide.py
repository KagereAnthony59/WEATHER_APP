import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_user_guide():
    doc = Document()

    # Set 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Color Palette
    COLOR_PRIMARY = RGBColor(26, 54, 93)      # Deep Navy #1A365D
    COLOR_SECONDARY = RGBColor(14, 116, 144)  # Ocean Blue #0E7490
    COLOR_ACCENT = RGBColor(217, 119, 6)      # Amber #D97706
    COLOR_DARK = RGBColor(30, 41, 59)         # Slate 800 #1E293B
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate 500 #64748B
    COLOR_BG_LIGHT = "F8FAFC"
    COLOR_PRIMARY_HEX = "1A365D"
    COLOR_SECONDARY_HEX = "0E7490"

    # Base Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = COLOR_DARK
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # Helper Functions
    def set_cell_shading(cell, color_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(28)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.size = Pt(26)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(20)
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.italic = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_heading_1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_heading_2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.bold = True
            run_b.font.color.rgb = COLOR_DARK
        p.add_run(text)
        return p

    def add_tip_box(text, title="PRO TIP"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_shading(cell, COLOR_BG_LIGHT)
        set_cell_margins(cell, 100, 100, 140, 140)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        run_t = p.add_run(f"💡 {title}: ")
        run_t.font.bold = True
        run_t.font.color.rgb = COLOR_SECONDARY
        p.add_run(text)
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    def add_screenshot(image_filename, caption, width_in=2.9):
        img_path = os.path.join(r"d:\PROJECTS\WEATHER_APP\screenshots", image_filename)
        if os.path.exists(img_path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.add_run().add_picture(img_path, width=Inches(width_in))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(14)
            run_cap = p_cap.add_run(caption)
            run_cap.font.italic = True
            run_cap.font.size = Pt(9.5)
            run_cap.font.color.rgb = COLOR_MUTED
        else:
            print(f"Warning: Image {image_filename} not found.")

    def add_dual_screenshots(img1, cap1, img2, cap2, width_in=2.5):
        p1 = os.path.join(r"d:\PROJECTS\WEATHER_APP\screenshots", img1)
        p2 = os.path.join(r"d:\PROJECTS\WEATHER_APP\screenshots", img2)
        
        tbl = doc.add_table(rows=1, cols=2)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        c1, c2 = tbl.cell(0, 0), tbl.cell(0, 1)
        c1.width, c2.width = Inches(3.1), Inches(3.1)
        set_cell_margins(c1, 40, 40, 40, 40)
        set_cell_margins(c2, 40, 40, 40, 40)
        
        if os.path.exists(p1):
            p = c1.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(p1, width=Inches(width_in))
            p_c = c1.add_paragraph()
            p_c.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rc = p_c.add_run(cap1)
            rc.font.italic = True
            rc.font.size = Pt(9)
            rc.font.color.rgb = COLOR_MUTED
            
        if os.path.exists(p2):
            p = c2.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(p2, width=Inches(width_in))
            p_c = c2.add_paragraph()
            p_c.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rc = p_c.add_run(cap2)
            rc.font.italic = True
            rc.font.size = Pt(9)
            rc.font.color.rgb = COLOR_MUTED
            
        doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------
    # DOCUMENT COVER & OVERVIEW
    # -------------------------------------------------------------
    add_title("K & A Weather App — User Guide")
    add_subtitle("Visual Walkthrough, Installation, Feature Guides & Automatic Updates")

    add_tip_box(
        "Welcome to K & A Weather! This illustrated guide walks you through installing the application, searching global locations, time-travel forecasts, air quality indices, and receiving automatic Over-The-Air updates.",
        "WELCOME"
    )

    # -------------------------------------------------------------
    # 1. INSTALLATION & INITIAL SETUP
    # -------------------------------------------------------------
    add_heading_1("1. Installation & Initial Setup (Android)")
    p = doc.add_paragraph()
    p.add_run("Follow these quick steps to install and set up the app on your Android device:")

    add_bullet("Open your download link (e.g., https://tinyurl.com/ka-weather or your Expo build page) in your mobile browser.", "Step 1 (Download): ")
    add_bullet("Tap 'Install' or 'Download (.apk)'. If Android shows 'File might be harmful', tap 'Download anyway' (this is a standard security prompt for apps installed outside the Play Store).", "Step 2 (Bypass Prompt): ")
    add_bullet("Open the downloaded file and tap 'Install' on the package installer prompt.", "Step 3 (Package Installer): ")
    add_bullet("When opening the app for the first time, tap 'While using the app' on the location permission dialog so K & A Weather can automatically detect your local weather.", "Step 4 (Grant Location): ")

    add_dual_screenshots(
        "Screenshot_20260911-165318.png", "Figure 1a: Expo EAS Download Page",
        "Screenshot_20260911-165516.png", "Figure 1b: Android Package Installer Prompt",
        width_in=2.5
    )

    add_screenshot(
        "Screenshot_20260911-165555.png",
        "Figure 1c: Granting Location Access on Initial Launch",
        width_in=2.6
    )

    # -------------------------------------------------------------
    # 2. MAIN DASHBOARD & LIVE TELEMETRY
    # -------------------------------------------------------------
    add_heading_1("2. Main Dashboard & Live Telemetry")
    p = doc.add_paragraph()
    p.add_run("The home screen gives you an immediate, comprehensive overview of current atmospheric telemetry:")

    add_bullet("Displays current temperature (e.g. 25°C), 'Feels Like' apparent temperature, relative humidity (60%), and wind speed (10 km/h).", "Main Temperature Hero: ")
    add_bullet("An AI-style meteorologist summary providing natural language guidance and rain alerts based on upcoming atmospheric trends.", "Today's Insight (AI Narrative): ")
    add_bullet("Dynamic high-resolution photographic backdrops automatically match the searched city and current sky condition.", "Dynamic City Backdrop: ")

    add_screenshot(
        "Screenshot_20260911-165655.png",
        "Figure 2: Main Home Dashboard with Live Telemetry & AI Insight",
        width_in=2.8
    )

    # -------------------------------------------------------------
    # 3. SEARCHING FOR CITIES & MANAGING FAVORITES
    # -------------------------------------------------------------
    add_heading_1("3. Searching for Cities & Multi-City Comparison")
    p = doc.add_paragraph()
    p.add_run("You can explore weather conditions for any city, district, or village worldwide:")

    add_bullet("Tap the search bar at the top, type at least 2 letters (e.g., 'Mpigi', 'London', 'Tokyo'), and select your location from the instant dropdown.", "Instant Search: ")
    add_bullet("Tap the GPS icon next to the search bar to return to your live physical GPS location at any time.", "Return to GPS: ")
    add_bullet("Tap the Heart (♡) icon next to the city name to save it to your bookmarks.", "Save Favorites: ")
    add_bullet("Saved cities appear in the horizontal quick bar (e.g., ★ Kampala, ★ Göteborg, ★ Jinja) for one-tap switching.", "Quick Switching: ")
    add_bullet("Tap the 'Compare' pill to open the Multi-City Comparison dashboard and view all your saved cities at a glance.", "Multi-City Dashboard: ")

    add_dual_screenshots(
        "Screenshot_20260911-165726.png", "Figure 3a: Instant Autocomplete Search",
        "Screenshot_20260911-165837.png", "Figure 3b: Multi-City Comparison Dashboard",
        width_in=2.5
    )

    # -------------------------------------------------------------
    # 4. 24-HOUR TIME TRAVEL & 7-DAY OUTLOOK
    # -------------------------------------------------------------
    add_heading_1("4. 24-Hour Time-Travel Scrubber & 7-Day Forecast")
    p = doc.add_paragraph()
    p.add_run(
        "K & A Weather includes an interactive time-travel simulation tool. "
        "Drag the horizontal slider across the 24-hour timeline to preview how temperature, precipitation chance, and day/night sky lighting will evolve throughout the day."
    )

    add_bullet("Tap any upcoming hour (e.g., 1 AM, 2 AM, 3 AM) to scrub the dashboard into that future hour.", "Time Travel: ")
    add_bullet("Scroll through the 7-Day Outlook cards below to plan your week ahead with high/low temperature forecasts and precipitation icons.", "7-Day Outlook: ")

    add_tip_box("To exit time-travel preview mode and return to real-time live weather, simply tap anywhere on the main temperature hero card.", "RESET LIVE TIME")

    add_screenshot(
        "Screenshot_20260911-165959.png",
        "Figure 4: 24-Hour Time-Travel Scrubber & 7-Day Outlook",
        width_in=2.8
    )

    # -------------------------------------------------------------
    # 5. BIOMETEOROLOGY, AIR QUALITY & POLLEN HUB
    # -------------------------------------------------------------
    add_heading_1("5. Air Quality, Pollen Counts & Health Hub")
    p = doc.add_paragraph()
    p.add_run("Protect your health with integrated environmental telemetry:")

    add_bullet("Monitors real-time Air Quality Index (e.g. 75 US AQI - Moderate) with health sensitivity guidance.", "Air Quality Index: ")
    add_bullet("Detailed breakdown of Fine Particulate Matter (PM2.5: 17 µg/m³), Coarse Dust (PM10: 22 µg/m³), Surface Ozone (O3: 110 µg/m³), and Nitrogen Dioxide (NO2: 1 µg/m³).", "Particulate Telemetry: ")
    add_bullet("Botanical pollen radar for Grass, Tree (Birch), and Ragweed to help allergy and asthma sufferers plan outdoor activities.", "Pollen Radar: ")
    add_bullet("Tap the 'Interactive Weather Map' card at the bottom to open the live precipitation radar satellite loop.", "Live Radar Launcher: ")

    add_screenshot(
        "Screenshot_20260911-170013.png",
        "Figure 5: Air Quality, Pollen Radar & Live Radar Launcher",
        width_in=2.8
    )

    # -------------------------------------------------------------
    # 6. SHARING WEATHER CARDS WITH FRIENDS
    # -------------------------------------------------------------
    add_heading_1("6. Generating & Sharing Weather Graphic Cards")
    p = doc.add_paragraph()
    p.add_run("You can generate and share sleek, high-definition weather graphic cards directly with your friends and classmates:")

    add_bullet("Tap the Share icon in the top control bar.", "Step 1: ")
    add_bullet("The app renders an aesthetic graphic card showing the date, city name, temperature, condition, humidity, wind, AQI, and UV index.", "Step 2: ")
    add_bullet("Tap 'Share via Apps / Messages' to send the card instantly through WhatsApp, Telegram, Instagram, or SMS.", "Step 3: ")

    add_screenshot(
        "Screenshot_20260911-170343.png",
        "Figure 6: Share Weather Card Modal",
        width_in=2.7
    )

    # -------------------------------------------------------------
    # 7. SETTINGS & PREFERENCES
    # -------------------------------------------------------------
    add_heading_1("7. Settings & Customization")
    p = doc.add_paragraph()
    p.add_run("Tap the Settings (⚙️) gear icon in the top control bar to customize your app experience:")

    add_bullet("Switch between Dark Glassmorphism and Light Sky visual themes.", "App Theme: ")
    add_bullet("Toggle between 12-Hour (AM/PM) and 24-Hour military time formats.", "Time Format: ")
    add_bullet("Toggle between Celsius (°C) and Fahrenheit (°F).", "Temperature Units: ")
    add_bullet("Toggle between Kilometers per hour (km/h) and Miles per hour (mph).", "Wind Speed Units: ")

    add_screenshot(
        "Screenshot_20260911-170357.png",
        "Figure 7: Settings & Preferences Modal",
        width_in=2.7
    )

    # -------------------------------------------------------------
    # 8. AUTOMATIC OVER-THE-AIR (OTA) UPDATES & FAQ
    # -------------------------------------------------------------
    add_heading_1("8. Automatic Updates & Frequently Asked Questions")

    add_heading_2("Q: How do I receive updates? Do I need to re-download the app?")
    p = doc.add_paragraph()
    p.add_run(
        "No re-downloading is required! K & A Weather is equipped with automatic Over-The-Air (OTA) background updates powered by Expo Updates. "
        "Whenever the developer pushes improvements, bug fixes, or new features, your app silently downloads the update in the background. "
        "Simply open or refresh the app, and the newest version will be applied automatically!"
    )

    add_heading_2("Q: The app says 'Location permission denied'. How do I fix it?")
    p = doc.add_paragraph()
    p.add_run("Go to your phone's Settings > Apps > K & A Weather > Permissions > Location, and set it to 'Allow while using the app'. Alternatively, you can search for any city manually using the top search bar.")

    add_heading_2("Q: Does the app work offline?")
    p = doc.add_paragraph()
    p.add_run("Yes! K & A Weather caches your last known weather report instantly in under 50ms upon app launch, functioning smoothly even when you have no cellular signal or Wi-Fi.")

    output_path = r"d:\PROJECTS\WEATHER_APP\K_and_A_Weather_User_Guide.docx"
    try:
        doc.save(output_path)
        print(f"User Guide with screenshots successfully created at: {output_path}")
    except PermissionError:
        output_path_alt = r"d:\PROJECTS\WEATHER_APP\K_and_A_Weather_User_Guide_Illustrated.docx"
        doc.save(output_path_alt)
        print(f"User Guide with screenshots successfully created at: {output_path_alt}")

if __name__ == "__main__":
    create_user_guide()
