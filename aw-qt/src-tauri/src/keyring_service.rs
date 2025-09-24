use keyring::Entry;

pub struct SystemKeychainService;

impl SystemKeychainService {
    /// Belirtilen anahtar için bir değeri sistem anahtar zincirine kaydeder.
    pub fn set_credential(service: &str, username: &str, password: &str) -> Result<(), String> {
        let entry = Entry::new(service, username);
        entry.set_password(password).map_err(|e| format!("Kimlik bilgisi kaydedilirken hata: {}", e))?;
        Ok(())
    }

    /// Belirtilen anahtar için değeri sistem anahtar zincirinden alır.
    pub fn get_credential(service: &str, username: &str) -> Result<String, String> {
        let entry = Entry::new(service, username);
        entry.get_password().map_err(|e| format!("Kimlik bilgisi alınırken hata: {}", e))?
    }

    /// Belirtilen anahtar için değeri sistem anahtar zincirinden siler.
    pub fn delete_credential(service: &str, username: &str) -> Result<(), String> {
        let entry = Entry::new(service, username);
        entry.delete_password().map_err(|e| format!("Kimlik bilgisi silinirken hata: {}", e))?;
        Ok(())
    }
} 