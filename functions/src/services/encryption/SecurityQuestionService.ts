import { SecurityQuestion, SecurityAnswer } from "../../types/security-questions.d";
import * as bcrypt from "bcrypt";

export class SecurityQuestionService {
    private readonly SALT_ROUNDS = 10; // bcrypt için tuzlama turu sayısı

    /**
     * Bir güvenlik sorusunun cevabını hashler.
     * @param answer Cevap stringi.
     * @returns Cevabın bcrypt hash'i.
     */
    public async hashAnswer(answer: string): Promise<string> {
        return bcrypt.hash(answer, this.SALT_ROUNDS);
    }

    /**
     * Bir güvenlik sorusunun cevabını verilen hash ile karşılaştırır.
     * @param answer Cevap stringi.
     * @param hashedAnswer Karşılaştırılacak hashlenmiş cevap.
     * @returns Cevap eşleşiyorsa true, aksi takdirde false.
     */
    public async verifyAnswer(answer: string, hashedAnswer: string): Promise<boolean> {
        return bcrypt.compare(answer, hashedAnswer);
    }

    /**
     * Kullanılabilir güvenlik sorularının bir listesini döndürür.
     * Bu metod, dinamik olarak veritabanından veya yapılandırma dosyasından soruları çekebilir.
     * Şimdilik sabit bir liste döndürüyor.
     * @param locale İsteğe bağlı olarak soruların dilini belirtir.
     * @returns Güvenlik sorularının listesi.
     */
    public async getAvailableQuestions(locale: string = "en"): Promise<SecurityQuestion[]> {
        // TODO: Soruları dinamik olarak veritabanından veya harici bir kaynaktan yükle
        const questions: SecurityQuestion[] = [
            { id: "q1", question: "Annenizin kızlık soyadı nedir?", locale: "tr" },
            { id: "q2", question: "İlk evcil hayvanınızın adı nedir?", locale: "tr" },
            { id: "q3", question: "Hangi şehirde doğdunuz?", locale: "tr" },
            { id: "q4", question: "What is your mother's maiden name?", locale: "en" },
            { id: "q5", question: "What was the name of your first pet?", locale: "en" },
            { id: "q6", question: "In which city were you born?", locale: "en" },
        ];
        return questions.filter(q => q.locale === locale || !q.locale);
    }

    /**
     * Kullanıcı tarafından kaydedilen güvenlik cevaplarını günceller veya kaydeder.
     * @param userId Cevapların kaydedileceği kullanıcı kimliği.
     * @param answers Kullanıcının güvenlik cevapları listesi.
     * @returns İşlemin başarılı olup olmadığını belirten bir Promise.
     */
    public async saveUserSecurityAnswers(userId: string, answers: SecurityAnswer[]): Promise<boolean> {
        console.log(`Kullanıcı ${userId} için güvenlik cevapları kaydediliyor:`, answers);
        // TODO: Cevapları güvenli bir şekilde depolayın (örn. Firestore, veritabanı).
        // Sadece hashlenmiş cevaplar depolanmalıdır.
        return true; // Başarılı olduğunu varsayalım
    }

    /**
     * Bir kullanıcının kaydedilmiş güvenlik cevaplarını alır.
     * @param userId Cevapları alınacak kullanıcı kimliği.
     * @returns Güvenlik cevapları listesi veya bulunamazsa null.
     */
    public async getUserSecurityAnswers(userId: string): Promise<SecurityAnswer[] | null> {
        console.log(`Kullanıcı ${userId} için güvenlik cevapları alınıyor.`);
        // TODO: Depolanan cevapları çekin.
        // Örnek: return await this.db.collection("userSecurityAnswers").doc(userId).get();
        return []; // Şimdilik boş liste döndürüyoruz
    }
} 