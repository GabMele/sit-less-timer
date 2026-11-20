use tauri::{LogicalSize, Manager};

// First-launch window size: 10% above the minimum (220x280).
// The width/height in tauri.conf.json are not applied on Windows (the OS default size is used),
// so the size is set explicitly, but only when there is no saved window state yet.
// After that the window-state plugin restores whatever size the user chose.
const START_SIZE: (f64, f64) = (242.0, 308.0);

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
