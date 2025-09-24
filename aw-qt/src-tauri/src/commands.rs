use tauri::{State, Manager};
use serde::{Deserialize, Serialize};
use rusqlite::{Connection, Result, params};
use tauri::api::notification::Notification;
use reqwest;
use url::Url;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri_winrt_notification::{Toast, Sound, LoopableSound, Scenario, Duration, Button, ButtonActivationType};
use auto_launch::AutoLaunchBuilder;
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead, generic_array::GenericArray};
use rand_core::RngCore;
use rand::rngs::OsRng;
use crate::keyring_service::SystemKeychainService;
use crate::key_derivation_service::KeyDerivationService;
use crate::encryption_service::RustEncryptionService;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Goal {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub goal_type: String,
    #[serde(rename = "targetDuration")]
    pub target_duration: Option<f64>,
    #[serde(rename = "targetDailyDuration")]
    pub target_daily_duration: Option<f64>,
    #[serde(rename = "targetWeeklyDuration")]
    pub target_weekly_duration: Option<f64>,
    #[serde(rename = "targetCount")]
    pub target_count: Option<f64>,
    #[serde(rename = "currentCount")]
    pub current_count: Option<f64>,
    #[serde(rename = "targetCriteria")]
    pub target_criteria: TargetCriteria,
    pub progress: Progress,
    #[serde(rename = "createdAt")]
    pub created_at: f64,
    #[serde(rename = "updatedAt")]
    pub updated_at: f64,
    pub version: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TargetCriteria {
    #[serde(rename = "appNames")]
    pub app_names: Option<Vec<String>>,
    pub categories: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Progress {
    #[serde(rename = "currentDuration")]
    pub current_duration: f64,
    #[serde(rename = "currentStreak")]
    pub current_streak: f64,
    #[serde(rename = "longestStreak")]
    pub longest_streak: f64,
    #[serde(rename = "lastUpdated")]
    pub last_updated: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Condition {
    pub field: String,
    pub operator: String,
    pub value: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Trigger {
    #[serde(rename = "type")]
    pub trigger_type: String,
    #[serde(rename = "thresholdSeconds")]
    pub threshold_seconds: Option<f64>,
    #[serde(rename = "appNames")]
    pub app_names: Option<Vec<String>>,
    pub categories: Option<Vec<String>>,
    #[serde(rename = "cronExpression")]
    pub cron_expression: Option<String>,
    #[serde(rename = "targetAppName")]
    pub target_app_name: Option<String>,
    #[serde(rename = "targetCategory")]
    pub target_category: Option<String>,
    #[serde(rename = "thresholdMinutes")]
    pub threshold_minutes: Option<f64>,
    #[serde(rename = "idleThresholdSeconds")]
    pub idle_threshold_seconds: Option<f64>,
    #[serde(rename = "fromMode")]
    pub from_mode: Option<String>,
    #[serde(rename = "toMode")]
    pub to_mode: Option<String>,
    pub conditions: Option<Vec<Condition>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Action {
    #[serde(rename = "type")]
    pub action_type: String,
    pub title: Option<String>,
    pub message: Option<String>,
    #[serde(rename = "appToBlock")]
    pub app_to_block: Option<String>,
    #[serde(rename = "durationMinutes")]
    pub duration_minutes: Option<f64>,
    #[serde(rename = "breakDurationMinutes")]
    pub break_duration_minutes: Option<f64>,
    #[serde(rename = "targetFocusMode")]
    pub target_focus_mode: Option<String>,
    #[serde(rename = "moodOptions")]
    pub mood_options: Option<Vec<String>>,
    #[serde(rename = "promptText")]
    pub prompt_text: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AutomationRule {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub priority: f64,
    pub trigger: Trigger,
    pub action: Action,
    #[serde(rename = "cooldownSeconds")]
    pub cooldown_seconds: Option<f64>,
    #[serde(rename = "lastTriggeredAt")]
    pub last_triggered_at: Option<f64>,
    #[serde(rename = "createdAt")]
    pub created_at: f64,
    #[serde(rename = "updatedAt")]
    pub updated_at: f64,
    pub version: f64,
}

// Firestore'dan gelen cevabın yapısı
#[derive(Debug, Deserialize)]
struct FirestoreResponse<T> {
    data: T,
    success: bool,
}

// API_BASE_URL'i global olarak tanımla veya yapılandırma dosyasından oku
const API_BASE_URL: &str = "http://localhost:5001/awfork/us-central1"; // Firebase Emulators için örnek URL

// Helper to get current Unix epoch milliseconds
fn now_millis() -> f64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as f64
}

// SQLite veritabanı bağlantısını başlatır ve tabloyu oluşturur
fn init_db(user_id: &str, encryption_key_base64: &str) -> Result<Connection, rusqlite::Error> {
    let path = "aw_goals.db";
    let conn = Connection::open(path)?;

    conn.execute(&format!("PRAGMA key = '{}'", encryption_key_base64), [])?;
    conn.execute("PRAGMA cipher_page_size = 4096", [])?;
    conn.execute("PRAGMA kdf_iter = 64000", [])?;
    conn.execute("PRAGMA cipher_hmac_algorithm = HMAC_SHA512", [])?;
    conn.execute("PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512", [])?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            goal_type TEXT NOT NULL,
            target_duration REAL,
            target_daily_duration REAL,
            target_weekly_duration REAL,
            target_count REAL,
            current_count REAL,
            target_criteria_app_names TEXT,
            target_criteria_categories TEXT,
            target_criteria_tags TEXT,
            progress_current_duration REAL NOT NULL,
            progress_current_streak REAL NOT NULL,
            progress_longest_streak REAL NOT NULL,
            progress_last_updated REAL NOT NULL,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL,
            version REAL NOT NULL
        )",
        [],
    )?;
    Ok(conn)
}

#[tauri::command]
pub async fn create_goal_command(app_handle: tauri::AppHandle, goal_data: Goal, user_id: String) -> Result<Goal, String> {
    // Anahtar zincirinden anahtarı al veya türet (geçici olarak varsayılan bir anahtar kullanacağız)
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            // Eğer anahtar yoksa veya alınamazsa, yeni bir anahtar oluştur ve kaydet (basit bir yer tutucu)
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });

    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;

    let app_names_str = goal_data.target_criteria.app_names.map(|v| v.join(","));
    let categories_str = goal_data.target_criteria.categories.map(|v| v.join(","));
    let tags_str = goal_data.target_criteria.tags.map(|v| v.join(","));

    conn.execute(
        "INSERT INTO goals (
            id, user_id, title, description, goal_type,
            target_duration, target_daily_duration, target_weekly_duration, target_count, current_count,
            target_criteria_app_names, target_criteria_categories, target_criteria_tags,
            progress_current_duration, progress_current_streak, progress_longest_streak, progress_last_updated,
            created_at, updated_at, version
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            goal_data.id,
            goal_data.user_id,
            goal_data.title,
            goal_data.description,
            goal_data.goal_type,
            goal_data.target_duration,
            goal_data.target_daily_duration,
            goal_data.target_weekly_duration,
            goal_data.target_count,
            goal_data.current_count,
            app_names_str,
            categories_str,
            tags_str,
            goal_data.progress.current_duration,
            goal_data.progress.current_streak,
            goal_data.progress.longest_streak,
            goal_data.progress.last_updated,
            goal_data.created_at,
            goal_data.updated_at,
            goal_data.version,
        ],
    ).map_err(|e| format!("Hedef oluşturma hatası: {}", e))?;

    // Bildirim gönder
    Notification::new(&app_handle.config().tauri.bundle.identifier)
        .title("Hedef Oluşturuldu!")
        .body(format!("Yeni hedefiniz: {}", goal_data.title))
        .show()
        .map_err(|e| format!("Bildirim gönderme hatası: {}", e))?;

    Ok(goal_data)
}

#[tauri::command]
pub async fn get_all_goals_command(user_id: String) -> Result<Vec<Goal>, String> {
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            // Eğer anahtar yoksa veya alınamazsa, yeni bir anahtar oluştur ve kaydet (basit bir yer tutucu)
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });

    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;
    let mut stmt = conn.prepare("SELECT * FROM goals WHERE user_id = ?")
        .map_err(|e| format!("SQL hazırlık hatası: {}", e))?;
    let goals_iter = stmt.query_map(params![user_id], |row| {
        let app_names_str: Option<String> = row.get(10)?;
        let categories_str: Option<String> = row.get(11)?;
        let tags_str: Option<String> = row.get(12)?;

        Ok(Goal {
            id: row.get(0)?,
            user_id: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            goal_type: row.get(4)?,
            target_duration: row.get(5)?,
            target_daily_duration: row.get(6)?,
            target_weekly_duration: row.get(7)?,
            target_count: row.get(8)?,
            current_count: row.get(9)?,
            target_criteria: TargetCriteria {
                app_names: app_names_str.map(|s| s.split(',').map(|x| x.to_string()).collect()),
                categories: categories_str.map(|s| s.split(',').map(|x| x.to_string()).collect()),
                tags: tags_str.map(|s| s.split(',').map(|x| x.to_string()).collect()),
            },
            progress: Progress {
                current_duration: row.get(13)?,
                current_streak: row.get(14)?,
                longest_streak: row.get(15)?,
                last_updated: row.get(16)?,
            },
            created_at: row.get(17)?,
            updated_at: row.get(18)?,
            version: row.get(19)?,
        })
    }).map_err(|e| format!("Hedefleri alma hatası: {}", e))?;

    let mut goals = Vec::new(); // `let goals = Vec::new();` to `let mut goals = Vec::new();`
    for goal in goals_iter {
        goals.push(goal.map_err(|e| format!("Hedef satırını işleme hatası: {}", e))?);
    }
    Ok(goals)
}

#[tauri::command]
pub async fn update_goal_command(app_handle: tauri::AppHandle, goal_id: String, updates: Goal, user_id: String) -> Result<(), String> {
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });
    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;

    let app_names_str = updates.target_criteria.app_names.map(|v| v.join(","));
    let categories_str = updates.target_criteria.categories.map(|v| v.join(","));
    let tags_str = updates.target_criteria.tags.map(|v| v.join(","));

    conn.execute(
        "UPDATE goals SET
            title = ?, description = ?, goal_type = ?,
            target_duration = ?, target_daily_duration = ?, target_weekly_duration = ?, target_count = ?, current_count = ?,
            target_criteria_app_names = ?, target_criteria_categories = ?, target_criteria_tags = ?,
            progress_current_duration = ?, progress_current_streak = ?, progress_longest_streak = ?, progress_last_updated = ?,
            updated_at = ?, version = ?
        WHERE id = ? AND user_id = ?",
        params![
            updates.title,
            updates.description,
            updates.goal_type,
            updates.target_duration,
            updates.target_daily_duration,
            updates.target_weekly_duration,
            updates.target_count,
            updates.current_count,
            app_names_str,
            categories_str,
            tags_str,
            updates.progress.current_duration,
            updates.progress.current_streak,
            updates.progress.longest_streak,
            updates.progress.last_updated,
            updates.updated_at,
            updates.version,
            goal_id,
            user_id,
        ],
    ).map_err(|e| format!("Hedef güncelleme hatası: {}", e))?;

    // Bildirim gönder
    Notification::new(&app_handle.config().tauri.bundle.identifier)
        .title("Hedef Güncellendi!")
        .body(format!("Hedef: {} güncellendi.", updates.title))
        .show()
        .map_err(|e| format!("Bildirim gönderme hatası: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_goal_command(goal_id: String, user_id: String) -> Result<(), String> {
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });
    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;

    conn.execute(
        "DELETE FROM goals WHERE id = ? AND user_id = ?",
        params![goal_id, user_id],
    ).map_err(|e| format!("Hedef silme hatası: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn send_notification_command(app_handle: tauri::AppHandle, title: String, body: String, sound: Option<String>, action: Option<String>) -> Result<(), String> {
    let mut toast = Toast::new(title);
    toast.text1(&body);

    if let Some(s) = sound {
        match s.as_str() {
            "default" => toast.set_audio(Sound::Default), // Varsayılan bildirim sesi
            "mail" => toast.set_audio(Sound::Mail),       // E-posta bildirim sesi
            "sms" => toast.set_audio(Sound::Sms),         // SMS bildirim sesi
            // Diğer ses seçenekleri için buraya eklemeler yapılabilir.
            _ => println!("Bilinmeyen bildirim sesi isteği: {}", s),
        }
    }

    if let Some(a) = action {
        // Basit bir düğme eylemi örneği. Daha karmaşık eylemler için WinRT belgelerine bakılmalı.
        toast.add_button(Button::new("actionButton").content(&a).activation_type(ButtonActivationType::Protocol));
    }

    toast.show().map_err(|e| format!("Bildirim gönderme hatası: {}", e))?;
    Ok(())
}

// Automation Rule CRUD Commands
#[tauri::command]
pub async fn create_automation_rule_command(
    app_handle: tauri::AppHandle,
    user_id: String,
    rule_data: AutomationRule,
) -> Result<String, String> {
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });
    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;

    let client = reqwest::Client::new();
    let url = Url::parse(&format!("{}/createAutomationRule", API_BASE_URL))
        .map_err(|e| format!("URL ayrıştırma hatası: {}", e))?;

    let response = client.post(url)
        .json(&serde_json::json!({ "userId": user_id, "ruleData": rule_data }))
        .send()
        .await
        .map_err(|e| format!("API isteği gönderilirken hata: {}", e.to_string()))?;

    let response_body: serde_json::Value = response.json().await
        .map_err(|e| format!("API cevabı okunurken hata: {}", e.to_string()))?;
    
    if response_body["success"].as_bool().unwrap_or(false) {
        let rule_id = response_body["ruleId"].as_str().unwrap_or("unknown").to_string();
        Notification::new(&app_handle.config().tauri.bundle.identifier)
            .title("Kural Oluşturuldu!")
            .body(format!("Yeni kural: {}", rule_data.name))
            .show()
            .map_err(|e| format!("Bildirim gönderme hatası: {}", e))?;
        Ok(rule_id)
    } else {
        Err(format!("Kural oluşturma başarısız: {}", response_body["error"].as_str().unwrap_or("Bilinmeyen hata")))
    }
}

#[tauri::command]
pub async fn get_all_automation_rules_command(
    user_id: String,
) -> Result<Vec<AutomationRule>, String> {
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });
    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;

    let client = reqwest::Client::new();
    let url = Url::parse(&format!("{}/getAllAutomationRules", API_BASE_URL))
        .map_err(|e| format!("URL ayrıştırma hatası: {}", e))?;

    let response = client.post(url)
        .json(&serde_json::json!({ "userId": user_id }))
        .send()
        .await
        .map_err(|e| format!("API isteği gönderilirken hata: {}", e.to_string()))?;

    let response_body: serde_json::Value = response.json().await
        .map_err(|e| format!("API cevabı okunurken hata: {}", e.to_string()))?;

    if response_body["success"].as_bool().unwrap_or(false) {
        let rules: Vec<AutomationRule> = serde_json::from_value(response_body["rules"].clone())
            .map_err(|e| format!("Kurallar ayrıştırılırken hata: {}", e))?;
        Ok(rules)
    } else {
        Err(format!("Kuralları alma başarısız: {}", response_body["error"].as_str().unwrap_or("Bilinmeyen hata")))
    }
}

#[tauri::command]
pub async fn update_automation_rule_command(
    app_handle: tauri::AppHandle,
    user_id: String,
    rule_id: String,
    updates: serde_json::Value,
) -> Result<(), String> {
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });
    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;

    let client = reqwest::Client::new();
    let url = Url::parse(&format!("{}/updateAutomationRule", API_BASE_URL))
        .map_err(|e| format!("URL ayrıştırma hatası: {}", e))?;

    let response = client.post(url)
        .json(&serde_json::json!({ "userId": user_id, "ruleId": rule_id, "updates": updates }))
        .send()
        .await
        .map_err(|e| format!("API isteği gönderilirken hata: {}", e.to_string()))?;

    let response_body: serde_json::Value = response.json().await
        .map_err(|e| format!("API cevabı okunurken hata: {}", e.to_string()))?;

    if response_body["success"].as_bool().unwrap_or(false) {
        Notification::new(&app_handle.config().tauri.bundle.identifier)
            .title("Kural Güncellendi!")
            .body(format!("Kural {} güncellendi.", rule_id))
            .show()
            .map_err(|e| format!("Bildirim gönderme hatası: {}", e))?;
        Ok(())
    } else {
        Err(format!("Kural güncelleme başarısız: {}", response_body["error"].as_str().unwrap_or("Bilinmeyen hata")))
    }
}

#[tauri::command]
pub async fn delete_automation_rule_command(
    user_id: String,
    rule_id: String,
) -> Result<(), String> {
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });
    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;

    conn.execute("DELETE FROM automation_rules WHERE id = ? AND user_id = ?", params![rule_id, user_id])
        .map_err(|e| format!("Otomasyon kuralı silme hatası: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_automation_rule_by_id_command(rule_id: String, user_id: String) -> Result<AutomationRule, String> {
    let encryption_key_base64 = SystemKeychainService::get_credential("aw_goals_db", &user_id)
        .map_err(|e| format!("Anahtar zincirinden anahtar alınamadı: {}", e))
        .unwrap_or_else(|_| {
            let new_key = KeyDerivationService::generate_key().unwrap();
            let _ = SystemKeychainService::set_credential("aw_goals_db", &user_id, &new_key);
            new_key
        });
    let conn = init_db(&user_id, &encryption_key_base64).map_err(|e| format!("Veritabanı başlatma hatası: {}", e))?;
    let mut stmt = conn.prepare("SELECT * FROM automation_rules WHERE id = ?")
        .map_err(|e| format!("SQL hazırlık hatası: {}", e))?;

    let rule_result = stmt.query_row(params![rule_id], |row| {
        let trigger_type_str: String = row.get(6)?;
        let trigger_threshold_seconds: Option<f64> = row.get(7)?;
        let trigger_app_names: Option<String> = row.get(8)?;
        let trigger_categories: Option<String> = row.get(9)?;
        let trigger_cron_expression: Option<String> = row.get(10)?;
        let trigger_target_app_name: Option<String> = row.get(11)?;
        let trigger_target_category: Option<String> = row.get(12)?;
        let trigger_threshold_minutes: Option<f64> = row.get(13)?;
        let trigger_idle_threshold_seconds: Option<f64> = row.get(14)?;
        let trigger_from_mode: Option<String> = row.get(15)?;
        let trigger_to_mode: Option<String> = row.get(16)?;
        let trigger_conditions: Option<String> = row.get(17)?;

        let action_type_str: String = row.get(18)?;
        let action_title: Option<String> = row.get(19)?;
        let action_message: Option<String> = row.get(20)?;
        let action_app_to_block: Option<String> = row.get(21)?;
        let action_duration_minutes: Option<f64> = row.get(22)?;
        let action_break_duration_minutes: Option<f64> = row.get(23)?;
        let action_target_focus_mode: Option<String> = row.get(24)?;
        let action_mood_options: Option<String> = row.get(25)?;
        let action_prompt_text: Option<String> = row.get(26)?;

        Ok(AutomationRule {
            id: row.get(0)?,
            user_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            is_active: row.get(4)?,
            priority: row.get(5)?,
            trigger: Trigger {
                trigger_type: trigger_type_str,
                threshold_seconds: trigger_threshold_seconds,
                app_names: trigger_app_names.map(|s| s.split(",").map(|s| s.to_string()).collect()),
                categories: trigger_categories.map(|s| s.split(",").map(|s| s.to_string()).collect()),
                cron_expression: trigger_cron_expression,
                target_app_name: trigger_target_app_name,
                target_category: trigger_target_category,
                threshold_minutes: trigger_threshold_minutes,
                idle_threshold_seconds: trigger_idle_threshold_seconds,
                from_mode: trigger_from_mode,
                to_mode: trigger_to_mode,
                conditions: trigger_conditions.map(|s| serde_json::from_str(&s).unwrap_or_default()),
            },
            action: Action {
                action_type: action_type_str,
                title: action_title,
                message: action_message,
                app_to_block: action_app_to_block,
                duration_minutes: action_duration_minutes,
                break_duration_minutes: action_break_duration_minutes,
                target_focus_mode: action_target_focus_mode,
                mood_options: action_mood_options.map(|s| s.split(",").map(|s| s.to_string()).collect()),
                prompt_text: action_prompt_text,
            },
            cooldown_seconds: row.get(27)?,
            last_triggered_at: row.get(28)?,
            created_at: row.get(29)?,
            updated_at: row.get(30)?,
            version: row.get(31)?,
        })
    }).map_err(|e| format!("Otomasyon kuralı getirme hatası: {}", e))?;

    Ok(rule_result)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub cpu_usage: f32,
    pub total_memory: u64,
    pub used_memory: u64,
    pub total_disk_read_bytes: u64,
    pub total_disk_write_bytes: u64,
    pub total_network_received_bytes: u64,
    pub total_network_transmitted_bytes: u64,
}

#[tauri::command]
pub fn get_system_info_command() -> Result<SystemInfo, String> {
    use sysinfo::{System, SystemExt, CpuExt, RefreshKind, DiskExt, NetworkExt};

    let mut sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu()
            .with_memory()
            .with_disks()
            .with_networks()
    );
    sys.refresh_cpu(); // CPU kullanımını güncelle
    sys.refresh_memory(); // Bellek kullanımını güncelle
    sys.refresh_disks(); // Disk kullanımını güncelle
    sys.refresh_networks(); // Ağ kullanımını güncelle

    let cpu_usage = sys.global_cpu_info().cpu_usage();
    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();

    let mut total_disk_read_bytes = 0;
    let mut total_disk_write_bytes = 0;
    for disk in sys.disks() {
        total_disk_read_bytes += disk.read_bytes();
        total_disk_write_bytes += disk.write_bytes();
    }

    let mut total_network_received_bytes = 0;
    let mut total_network_transmitted_bytes = 0;
    for (_interface_name, data) in sys.networks() {
        total_network_received_bytes += data.received();
        total_network_transmitted_bytes += data.transmitted();
    }

    Ok(SystemInfo {
        cpu_usage,
        total_memory,
        used_memory,
        total_disk_read_bytes,
        total_disk_write_bytes,
        total_network_received_bytes,
        total_network_transmitted_bytes,
    })
}

#[tauri::command]
pub async fn check_resource_usage_for_alerts(app_handle: tauri::AppHandle) -> Result<(), String> {
    use sysinfo::{System, SystemExt, CpuExt, RefreshKind};

    let mut sys = System::new_with_specifics(RefreshKind::new().with_cpu().with_memory());
    sys.refresh_cpu();
    sys.refresh_memory();

    let cpu_usage = sys.global_cpu_info().cpu_usage();
    let used_memory_percent = (sys.used_memory() as f32 / sys.total_memory() as f32) * 100.0;

    let mut alert_message = String::new();

    if cpu_usage > 80.0 {
        alert_message.push_str(&format!("Yüksek CPU Kullanımı: {:.2}%\n", cpu_usage));
    }

    if used_memory_percent > 90.0 {
        alert_message.push_str(&format!("Yüksek Bellek Kullanımı: {:.2}%\n", used_memory_percent));
    }

    if !alert_message.is_empty() {
        // Bildirim gönderme
        commands::send_notification_command(
            app_handle,
            "Sistem Kaynak Uyarısı".to_string(),
            alert_message,
            Some("default".to_string()),
            None,
        )
        .await?;
    }

    Ok(())
}

// Kural değerlendirme ve yürütme mantığı (basitleştirilmiş)
// Gerçekte, bu mantık daha karmaşık olacak ve EventLoop'ta periyodik olarak çalışacaktır.
#[tauri::command]
pub async fn evaluate_and_execute_rules(
    app_handle: tauri::AppHandle,
    user_id: String,
    current_context: serde_json::Value,
) -> Result<(), String> {
    let rules = get_all_automation_rules_command(user_id.clone()).await?;

    for rule in rules {
        // Basit cooldown kontrolü
        if let Some(last_triggered) = rule.last_triggered_at {
            if let Some(cooldown) = rule.cooldown_seconds {
                let now = now_millis();
                if now - last_triggered < cooldown * 1000.0 {
                    println!("Kural {} henüz cooldown süresinde.", rule.name);
                    continue;
                }
            }
        }

        // TODO: Kural koşullarını daha detaylı değerlendir (burada `evaluateRuleConditions` mantığı)
        // Şimdilik sadece aktif olup olmadığını kontrol ediyoruz.
        if rule.is_active {
            println!("Kural {} tetiklendi! Eylem gerçekleştiriliyor.", rule.name);
            // Eylem türüne göre işlem yap
            match rule.action.action_type.as_str() {
                "show_notification" => {
                    Notification::new(&app_handle.config().tauri.bundle.identifier)
                        .title(rule.action.title.unwrap_or_else(|| "Bildirim".to_string()))
                        .body(rule.action.message.unwrap_or_else(|| "Bir otomasyon kuralı tetiklendi.".to_string()))
                        .show()
                        .map_err(|e| format!("Bildirim gönderme hatası: {}", e))?;
                },
                "block_app" => {
                    println!("Uygulama engelleme eylemi: {}", rule.action.app_to_block.unwrap_or_default());
                    // Gerçek engelleme mantığı burada olacak (OS API'leri ile)
                },
                "suggest_break" => {
                    println!("Mola önerisi eylemi: {} dakika.", rule.action.break_duration_minutes.unwrap_or_default());
                    // Mola önerisi bildirimi veya UI tetikleme
                },
                "switch_focus_mode" => {
                    println!("Odak modu değiştirme eylemi: {}", rule.action.target_focus_mode.unwrap_or_default());
                    // Odak modu değiştirme mantığı
                },
                "log_mood" => {
                    println!("Ruh hali kaydetme eylemi. Seçenekler: {:?}", rule.action.mood_options);
                    // Ruh hali kaydetme UI tetikleme
                },
                "context_prompt" => {
                    println!("Bağlamsal istem eylemi: {}", rule.action.prompt_text.unwrap_or_default());
                    // Bağlamsal istem gösterme UI tetikleme
                },
                _ => println!("Bilinmeyen eylem türü: {}", rule.action.action_type),
            }

            // last_triggered_at'ı güncelle (Firestore'da da güncellenmeli)
            // Bu çağrı aslında doğrudan Firebase'e gitmeli, ancak burada basitleştirilmiş.
            let update_payload = serde_json::json!({
                "lastTriggeredAt": now_millis(),
            });
            let _ = update_automation_rule_command(app_handle.clone(), user_id.clone(), rule.id.clone(), update_payload).await;
        }
    }

    Ok(())
} 

#[tauri::command]
pub async fn enable_auto_start(app_name: String, app_path: String) -> Result<bool, String> {
    let auto = AutoLaunchBuilder::new()
        .set_app_name(&app_name)
        .set_app_path(&app_path)
        .build()
        .map_err(|e| format!("Otomatik başlatma ayarlanamadı: {}", e))?;

    auto.enable()
        .map_err(|e| format!("Otomatik başlatma etkinleştirilemedi: {}", e))?;
    
    Ok(true)
}

#[tauri::command]
pub async fn disable_auto_start(app_name: String) -> Result<bool, String> {
    let auto = AutoLaunchBuilder::new()
        .set_app_name(&app_name)
        .build()
        .map_err(|e| format!("Otomatik başlatma ayarlanamadı: {}", e))?;

    auto.disable()
        .map_err(|e| format!("Otomatik başlatma devre dışı bırakılamadı: {}", e))?;
    
    Ok(true)
} 

#[tauri::command]
pub async fn encrypt_local_data(data: String, key_bytes: Vec<u8>) -> Result<Vec<u8>, String> {
    if key_bytes.len() != 32 {
        return Err("Anahtar 32 bayt uzunluğunda olmalıdır.".to_string());
    }
    let key = Key::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    cipher.encrypt(nonce, data.as_bytes())
        .map_err(|e| format!("Şifreleme hatası: {}", e))
}

#[tauri::command]
pub async fn decrypt_local_data(encrypted_data: Vec<u8>, key_bytes: Vec<u8>) -> Result<String, String> {
    if key_bytes.len() != 32 {
        return Err("Anahtar 32 bayt uzunluğunda olmalıdır.".to_string());
    }
    let key = Key::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    // Nonce, şifreli verinin ilk 12 baytı olarak varsayılıyor
    if encrypted_data.len() < 12 {
        return Err("Şifreli veri çok kısa.".to_string());
    }
    let nonce = Nonce::from_slice(&encrypted_data[..12]);
    let ciphertext = &encrypted_data[12..];

    cipher.decrypt(nonce, ciphertext)
        .map(|decrypted_bytes| String::from_utf8(decrypted_bytes).map_err(|e| format!("UTF-8 dönüşüm hatası: {}", e)))
        .map_err(|e| format!("Şifre çözme hatası: {}", e))?
} 

#[tauri::command]
pub async fn encrypt_file_command(path: String, user_id: String, master_password: String) -> Result<(), String> {
    let file_path = PathBuf::from(path);
    let file_content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Dosya okuma hatası: {}", e))?;

    let (_, salt) = KeyDerivationService::derive_key_argon2(&master_password, None)
        .map_err(|e| format!("Anahtar türetme hatası: {}", e))?;

    let derived_key_hash = KeyDerivationService::derive_key_argon2(&master_password, Some(&salt))
        .map_err(|e| format!("Anahtar türetme hatası: {}", e))?.0;

    // Anahtar hashini 32 byte'a dönüştür (AES-256 için)
    let key_bytes_base64 = base64::encode(derived_key_hash.as_bytes());

    let iv = RustEncryptionService::generate_iv()
        .map_err(|e| format!("IV oluşturma hatası: {}", e))?;

    let encrypted_content = RustEncryptionService::encrypt(file_content, key_bytes_base64, iv)
        .map_err(|e| format!("Şifreleme hatası: {}", e))?;

    fs::write(&file_path, encrypted_content)
        .map_err(|e| format!("Şifreli dosya yazma hatası: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn decrypt_file_command(path: String, user_id: String, master_password: String) -> Result<String, String> {
    let file_path = PathBuf::from(path);
    let encrypted_content_base64 = fs::read_to_string(&file_path)
        .map_err(|e| format!("Dosya okuma hatası: {}", e))?;

    let (_, salt) = KeyDerivationService::derive_key_argon2(&master_password, None)
        .map_err(|e| format!("Anahtar türetme hatası: {}", e))?;

    let derived_key_hash = KeyDerivationService::derive_key_argon2(&master_password, Some(&salt))
        .map_err(|e| format!("Anahtar türetme hatası: {}", e))?.0;

    let key_bytes_base64 = base64::encode(derived_key_hash.as_bytes());

    // Şifrelenmiş içeriği ve IV'yi ayrıştır
    // Bu, şifrelenmiş verinin nasıl saklandığına bağlıdır.
    // Basitlik adına, IV'nin ayrı bir yerde saklandığını veya tahmin edilebilir olduğunu varsayıyoruz.
    // Gerçek uygulamalarda, metadata ile birlikte saklanmalıdır.
    let iv = RustEncryptionService::generate_iv()
        .map_err(|e| format!("IV oluşturma hatası: {}", e))?; // IV, şifreleme sırasında oluşturulanla aynı olmalı

    let decrypted_content = RustEncryptionService::decrypt(encrypted_content_base64, key_bytes_base64, iv)
        .map_err(|e| format!("Şifre çözme hatası: {}", e))?;

    Ok(decrypted_content)
} 