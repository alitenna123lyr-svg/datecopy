use enigo::{Enigo, Keyboard, Settings, Key, Direction};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

// 防抖：记录上次执行时间
static LAST_PASTE: Mutex<Option<Instant>> = Mutex::new(None);

// 复制文本并模拟粘贴
#[tauri::command]
fn copy_and_paste(text: String) {
    // 防抖检查：500ms 内不重复执行
    {
        let mut last = LAST_PASTE.lock().unwrap();
        if let Some(instant) = *last {
            if instant.elapsed() < Duration::from_millis(500) {
                return;
            }
        }
        *last = Some(Instant::now());
    }

    // 使用系统剪贴板
    if let Ok(mut clipboard) = arboard::Clipboard::new() {
        let _ = clipboard.set_text(&text);
    }

    // 等待用户释放快捷键，给足够时间让焦点稳定
    thread::sleep(Duration::from_millis(200));

    // 模拟 Ctrl+V 粘贴
    if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
        // 先确保所有修饰键都释放
        let _ = enigo.key(Key::Shift, Direction::Release);
        let _ = enigo.key(Key::Control, Direction::Release);
        thread::sleep(Duration::from_millis(50));

        // 然后执行粘贴
        let _ = enigo.key(Key::Control, Direction::Press);
        thread::sleep(Duration::from_millis(30));
        let _ = enigo.key(Key::Unicode('v'), Direction::Click);
        thread::sleep(Duration::from_millis(30));
        let _ = enigo.key(Key::Control, Direction::Release);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]),
        ))
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![copy_and_paste])
        .setup(|app| {
            // 创建托盘菜单
            let show_i = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            // 创建系统托盘
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // 拦截关闭事件，改为隐藏到托盘
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
