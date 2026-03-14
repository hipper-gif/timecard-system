// SmartClock 常駐打刻端末
// localhost:3010/kiosk を表示する常駐ウィンドウ

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Manager,
};
use tauri_plugin_autostart::ManagerExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("main window not found");

            // --- システムトレイの設定 ---
            let show_item = MenuItemBuilder::with_id("show", "表示").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "終了").build(app)?;
            let tray_menu = MenuBuilder::new(app)
                .item(&show_item)
                .separator()
                .item(&quit_item)
                .build()?;

            let icon = Image::from_path("icons/icon.png").unwrap_or_else(|_| {
                app.default_window_icon().cloned().unwrap()
            });

            TrayIconBuilder::new()
                .icon(icon)
                .tooltip("SmartClock")
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        if let Some(w) = tray.app_handle().get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            // --- ウィンドウ閉じる → 非表示（トレイ常駐） ---
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window_clone.hide();
                }
            });

            // 右クリックメニュー無効化（リリースビルド時）
            #[cfg(not(debug_assertions))]
            {
                let _ = window.eval(
                    "document.addEventListener('contextmenu', e => e.preventDefault())",
                );
            }

            // 自動起動を有効化
            let autostart = app.autolaunch();
            let _ = autostart.enable();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("SmartClock の起動に失敗しました");
}
