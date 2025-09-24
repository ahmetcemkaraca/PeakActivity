import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

export class AuthService {
  private authInstance;

  constructor() {
    this.authInstance = auth;
  }

  /**
   * Yeni bir kullanıcı kaydeder.
   * @param email Kullanıcı e-postası.
   * @param password Kullanıcı şifresi.
   * @returns Kaydedilen kullanıcı bilgileri.
   */
  async register(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.authInstance,
        email,
        password
      );
      return userCredential.user;
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      throw error;
    }
  }

  /**
   * Bir kullanıcıyı giriş yapar.
   * @param email Kullanıcı e-postası.
   * @param password Kullanıcı şifresi.
   * @returns Giriş yapılan kullanıcı bilgileri.
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.authInstance, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      throw error;
    }
  }

  /**
   * Aktif kullanıcıyı çıkış yapar.
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.authInstance);
    } catch (error: any) {
      console.error('Çıkış hatası:', error);
      throw error;
    }
  }

  /**
   * Kimlik doğrulama durumu değişikliklerini dinler.
   * @param callback Kullanıcı değiştiğinde çağrılacak geri çağırma fonksiyonu.
   * @returns İptal etme fonksiyonu.
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.authInstance, callback);
  }
}
