// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;

#[tauri::command]
fn get_images_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    app_handle
        .path()
        .app_data_dir()
        .map(|path| path.join("images").to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_images_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
