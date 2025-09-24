use argon2::{password_hash::{rand_core::OsRng, SaltString}, Argon2, PasswordHasher};

pub struct KeyDerivationService;

impl KeyDerivationService {
    /// Anahtar türetme için Argon2id kullanır.
    /// Paroladan güvenli bir anahtar türetir.
    pub fn derive_key_argon2(password: &str, salt: Option<&str>) -> Result<(String, String), String> {
        let salt_string = match salt {
            Some(s) => SaltString::b64_decode(s).map_err(|e| format!("Tuz çözme hatası: {}", e))?,
            None => SaltString::generate(&mut OsRng)
        };

        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0P13, argon2::Params::new(1024 * 64, 3, 1, None).unwrap());

        let password_hash = argon2.hash_password(password.as_bytes(), &salt_string)
            .map_err(|e| format!("Parola hashleme hatası: {}", e))?;

        Ok((password_hash.to_string(), salt_string.to_string()))
    }

    /// Türetilmiş bir anahtarı parolaya karşı doğrular.
    pub fn verify_key_argon2(password: &str, hash: &str) -> Result<bool, String> {
        let password_hash = argon2::PasswordHash::parse(hash, argon2::password_hash::Encoding::Bcrypt)
            .map_err(|e| format!("Hash ayrıştırma hatası: {}", e))?;

        let argon2 = Argon2::default();
        Ok(argon2.verify_password(password.as_bytes(), &password_hash).is_ok())
    }
} 