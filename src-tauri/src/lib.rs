use tauri::{LogicalSize, Manager};
use tauri_plugin_window_state::StateFlags;

// Default window size: 10% above the minimum (220x280).
// The width/height in tauri.conf.json are not applied on Windows (the OS default size is used),
// so the size is set explicitly at startup and is not restored from the saved window state.
const START_SIZE: (f64, f64) = (242.0, 308.0);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::all() & !StateFlags::SIZE)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_size(LogicalSize::new(START_SIZE.0, START_SIZE.1));
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while starting Sit-less Timer");
}
