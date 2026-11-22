use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;
use tauri::{Emitter, LogicalSize, Manager, Monitor, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;

// First-launch window size: 10% above the minimum (198x252).
// The width/height in tauri.conf.json are not applied on Windows (the OS default size is used),
// so the size is set explicitly, but only when there is no saved window state yet.
// After that the window-state plugin restores whatever size the user chose.
const START_SIZE: (f64, f64) = (218.0, 277.0);

/// True when the window-state plugin has not stored anything yet (first launch).
/// Must be evaluated before the plugin is initialized, because it creates the file.
fn is_first_launch() -> bool {
    match std::env::var_os("APPDATA") {
        Some(dir) => !std::path::Path::new(&dir)
            .join("com.gabmele.timer")
            .join(".window-state.json")
            .exists(),
        None => false,
    }
}

/// Asks the user where to save a text file and writes it there.
/// Returns false if the user cancelled the dialog.
#[tauri::command]
async fn save_text_file(app: tauri::AppHandle, name: String, content: String) -> Result<bool, String> {
    let Some(picked) = app
        .dialog()
        .file()
        .add_filter("CSV", &["csv"])
        .set_file_name(&name)
        .blocking_save_file()
    else {
        return Ok(false);
    };
    let path = picked.into_path().map_err(|e| e.to_string())?;
    std::fs::write(path, content.as_bytes()).map_err(|e| e.to_string())?;
    Ok(true)
}

/// Milliseconds since the last keyboard/mouse input anywhere in the system (Windows only).
/// Returns None when the value is unavailable, so the frontend can disable auto-resume.
#[tauri::command]
fn idle_ms() -> Option<u64> {
    #[cfg(windows)]
    {
        use windows_sys::Win32::System::SystemInformation::GetTickCount;
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
        let mut info = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
        // SAFETY: info is a valid, correctly sized LASTINPUTINFO; both calls are plain Win32 getters.
        unsafe {
            if GetLastInputInfo(&mut info) == 0 {
                return None;
            }
            // both values are 32-bit tick counts that wrap together: wrapping_sub is correct
            Some(GetTickCount().wrapping_sub(info.dwTime) as u64)
        }
    }
    #[cfg(not(windows))]
    {
        None
    }
}

// "Are you still there?" card: full logical size, the fraction of it used while the card is "small",
// and the distance from the work-area edge of each monitor.
// The window itself is resized (small, then full size) instead of scaling its content: window-border tools
// (e.g. Tacky Borders) draw the border around the real window, which would otherwise always show the full size.
const PROMPT_SIZE: (f64, f64) = (400.0, 240.0);
const PROMPT_SMALL: f64 = 0.7;
const PROMPT_MARGIN: f64 = 16.0;
// the grow is a fade-out, the resize, then a fade-in (done by the page on the two events); this is the fade-out time
const PROMPT_DIP_MS: u64 = 400;
// bumped on every new prompt, so a pending "grow" of an older prompt never touches a newer one
static PROMPT_GEN: AtomicU64 = AtomicU64::new(0);

/// Keeps only a 6-digit hex color (without '#'); anything else falls back to the default.
/// The values end up in a URL, so nothing else may pass through.
fn hex6(v: &str, default: &str) -> String {
    let v = v.trim_start_matches('#');
    if v.len() == 6 && v.chars().all(|c| c.is_ascii_hexdigit()) { v.to_string() } else { default.to_string() }
}

/// Sizes the card window (`scale` of the full size) and puts it at the chosen position of the monitor's work area.
fn place_prompt(win: &WebviewWindow, m: &Monitor, h: &str, v: &str, scale: f64) {
    let sf = m.scale_factor();
    let wa = m.work_area();
    let w_px = (PROMPT_SIZE.0 * scale * sf).round() as i32;
    let h_px = (PROMPT_SIZE.1 * scale * sf).round() as i32;
    let margin = (PROMPT_MARGIN * sf).round() as i32;
    let (wa_w, wa_h) = (wa.size.width as i32, wa.size.height as i32);
    let x = match h {
        "left" => wa.position.x + margin,
        "center" => wa.position.x + (wa_w - w_px) / 2,
        _ => wa.position.x + wa_w - w_px - margin,
    };
    let y = match v {
        "top" => wa.position.y + margin,
        "middle" => wa.position.y + (wa_h - h_px) / 2,
        _ => wa.position.y + wa_h - h_px - margin,
    };
    let _ = win.set_size(PhysicalSize::new(w_px as u32, h_px as u32));
    let _ = win.set_position(PhysicalPosition::new(x, y));
}

fn close_idle_prompts(app: &tauri::AppHandle) {
    for (label, w) in app.webview_windows() {
        if label.starts_with("idle-") {
            let _ = w.destroy();
        }
    }
}

/// Shows the "Are you still there?" card on every monitor, at the chosen position of its work area.
/// `end` is the deadline (epoch ms) so the cards and the main window count down in sync.
/// h: left | center | right, v: top | middle | bottom. Colors are 6-digit hex without '#':
/// ca / cb = gradient, tx = text color, pl = color of the plate behind the text.
/// The cards start small and are resized to full size `grow_after` ms later (a single step, no continuous scaling).
/// Async on purpose: creating windows from a synchronous command can deadlock on Windows.
#[tauri::command]
async fn show_idle_prompt(
    app: tauri::AppHandle,
    seconds: u32,
    end: u64,
    lang: String,
    h: String,
    v: String,
    ca: String,
    cb: String,
    tx: String,
    pl: String,
    grow_after: u64,
) -> Result<(), String> {
    close_idle_prompts(&app);
    let gen = PROMPT_GEN.fetch_add(1, Ordering::SeqCst) + 1;
    let lang: String = lang.chars().filter(|c| c.is_ascii_alphabetic()).take(2).collect();
    // only known values end up in the URL
    let h = match h.as_str() { "left" => "left", "center" => "center", _ => "right" };
    let v = match v.as_str() { "top" => "top", "middle" => "middle", _ => "bottom" };
    let query = format!(
        "idle.html?s={}&end={}&lang={}&h={}&v={}&ca={}&cb={}&tx={}&pl={}",
        seconds.clamp(5, 120),
        end,
        lang,
        h,
        v,
        hex6(&ca, "ff9f1c"),
        hex6(&cb, "e8457c"),
        hex6(&tx, "101616"),
        hex6(&pl, "ffffff"),
    );
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    for (i, m) in monitors.iter().enumerate() {
        // transparent + starts at opacity 0 (fade-in), so the moment before it is moved is not visible
        let win = WebviewWindowBuilder::new(&app, format!("idle-{i}"), WebviewUrl::App(query.clone().into()))
            .title("Sit-less Timer")
            .decorations(false)
            .transparent(true)
            .shadow(false)
            .resizable(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .focused(false)
            .build()
            .map_err(|e| e.to_string())?;
        place_prompt(&win, m, h, v, PROMPT_SMALL);
    }
    // grow to full size after the delay: the cards fade out, are resized while invisible, then fade back in.
    // Unless the prompt was closed or replaced meanwhile.
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(grow_after.saturating_sub(PROMPT_DIP_MS)));
        if PROMPT_GEN.load(Ordering::SeqCst) != gen {
            return;
        }
        let _ = handle.emit("idle-grow-start", ());
        std::thread::sleep(Duration::from_millis(PROMPT_DIP_MS));
        if PROMPT_GEN.load(Ordering::SeqCst) != gen {
            return;
        }
        if let Ok(monitors) = handle.available_monitors() {
            for (i, m) in monitors.iter().enumerate() {
                if let Some(win) = handle.get_webview_window(&format!("idle-{i}")) {
                    place_prompt(&win, m, h, v, 1.0);
                }
            }
        }
        std::thread::sleep(Duration::from_millis(120));   // let the page re-fit to the new size
        if PROMPT_GEN.load(Ordering::SeqCst) == gen {
            let _ = handle.emit("idle-grow-end", ());
        }
    });
    Ok(())
}

#[tauri::command]
fn hide_idle_prompt(app: tauri::AppHandle) {
    PROMPT_GEN.fetch_add(1, Ordering::SeqCst);
    close_idle_prompts(&app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let first_launch = is_first_launch();
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_text_file, idle_ms, show_idle_prompt, hide_idle_prompt])
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(move |app| {
            if first_launch {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.set_size(LogicalSize::new(START_SIZE.0, START_SIZE.1));
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while starting Sit-less Timer");
}
