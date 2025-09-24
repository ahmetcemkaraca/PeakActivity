use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};
use rand_chacha::{rand_core::SeedableRng, ChaCha20Rng};
use rand::RngCore;
use crate::encryption_service::RustEncryptionService;
use crate::keyring_service::SystemKeychainService;
use crate::key_derivation_service::KeyDerivationService;

#[test]
fn test_rust_encryption_service() {
    let original_data = "Hello, secure world!";
    let key_result = RustEncryptionService::generate_key();
    assert!(key_result.is_ok());
    let key = key_result.unwrap();

    let iv_result = RustEncryptionService::generate_iv();
    assert!(iv_result.is_ok());
    let iv = iv_result.unwrap();

    let encrypted_result = RustEncryptionService::encrypt(original_data.to_string(), key.clone(), iv.clone());
    assert!(encrypted_result.is_ok());
    let encrypted_data = encrypted_result.unwrap();

    assert_ne!(original_data, encrypted_data); // Şifreli veri orijinalden farklı olmalı

    let decrypted_result = RustEncryptionService::decrypt(encrypted_data, key, iv);
    assert!(decrypted_result.is_ok());
    let decrypted_data = decrypted_result.unwrap();

    assert_eq!(original_data, decrypted_data);
}

#[test]
fn test_key_derivation_service_argon2() {
    let password = "mySuperSecretPassword";
    let (hash, salt) = KeyDerivationService::derive_key_argon2(password, None).unwrap();
    assert!(!hash.is_empty());
    assert!(!salt.is_empty());

    let is_valid = KeyDerivationService::verify_key_argon2(password, &hash).unwrap();
    assert!(is_valid);

    let wrong_password = "wrongPassword";
    let is_invalid = KeyDerivationService::verify_key_argon2(wrong_password, &hash).unwrap_err();
    assert!(is_invalid.contains("InvalidPassword")); // Argon2 kütüphanesine göre hata mesajı değişebilir
}

#[test]
fn test_system_keychain_service() {
    // Bu testler platforma ve CI/CD ortamına göre değişebilir.
    // Gerçek sistem anahtar zinciri etkileşimi mock'lanmalı veya yalnızca güvenli ortamlarda çalıştırılmalıdır.

    let service_name = "test_app_service";
    let username = "test_user";
    let password = "test_password_123";

    // Test: set_credential
    let set_result = SystemKeychainService::set_credential(service_name, username, password);
    assert!(set_result.is_ok(), "set_credential başarısız oldu: {:?}", set_result);

    // Test: get_credential
    let get_result = SystemKeychainService::get_credential(service_name, username);
    assert!(get_result.is_ok(), "get_credential başarısız oldu: {:?}", get_result);
    assert_eq!(get_result.unwrap(), password);

    // Test: delete_credential
    let delete_result = SystemKeychainService::delete_credential(service_name, username);
    assert!(delete_result.is_ok(), "delete_credential başarısız oldu: {:?}", delete_result);

    // Test: Silindikten sonra bulunamamalı
    let get_after_delete_result = SystemKeychainService::get_credential(service_name, username);
    assert!(get_after_delete_result.is_err());
    assert!(get_after_delete_result.unwrap_err().contains("Bulunamadı")); // Hata mesajı keyring kütüphanesine göre değişebilir
} 