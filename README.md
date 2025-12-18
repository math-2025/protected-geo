# GeoShield - Strategiya və Təhlükəsizliyin Kəsişməsi

## Məqsəd
Riyaziyyat və müasir proqramlaşdırma texnologiyalarını hərbi sahədə tətbiq edərək təhlükəsiz, çevik və real-zamanlı strateji idarəetmə platforması yaratmaq.

## Konsepsiya
GeoShield, müasir döyüş şəraitinin tələblərinə cavab verən, mərkəzləşdirilmiş bir komanda-kontrol platformasıdır. Sistemin əsas məqsədi, hərbi bölüklərin mövqelərini təhlükəsiz şəkildə izləmək, əməliyyatları real-zamanlı idarə etmək və bütün məlumat axınını mürəkkəb riyazi alqoritmlərlə şifrələyərək düşmən müdaxiləsindən qorumaqdır.

Platforma, real-zamanlı məlumat sinxronizasiyası üçün **Firebase Firestore**, təhlükəsiz autentikasiya və müasir istifadəçi interfeysi üçün **Next.js**, **React** və **TailwindCSS** kimi qabaqcıl texnologiyalardan istifadə edir.

## Riyazi Mühərriklər

### 1. Koordinatların Şifrələnməsi: 5-Qatlı Riyazi Çevrilmə
GeoShield sisteminin fərqləndirici xüsusiyyəti onun çoxqatmanlı koordinat şifrələmə mühərrikidir. Bu mühərrik, sistemin təməlini təşkil edir və bütün kritik mövqe məlumatlarının təhlükəsizliyini təmin edir. Məlumatların şifrələnməsi, bir-birini tamamlayan 5 fərqli riyazi və alqoritmik qatdan ibarətdir:

1.  **Kollats Fərziyyəsi ilə Qarışdırma (Collatz Conjecture Scrambling):** Koordinatların ilkin qarışdırılması üçün riyaziyyatın həll olunmamış problemlərindən biri olan Kollats fərziyyəsinə əsaslanan alqoritmdən istifadə edilir.
2.  **Sadə Ədədlə Atlama (Prime-Jump Encryption):** Şifrələmə açarından yaradılan təsadüfi sadə ədədlərə əsaslanaraq koordinatların dəyərini dəyişdirir.
3.  **Fibonaççi Spiral Sürüşdürməsi (Fibonacci Spiral Displacement):** Qızıl bucaq və Fibonaççi ardıcıllığından ilhamlanaraq koordinatlara spiralvari və qeyri-xətti bir yerdəyişmə tətbiq edir.
4.  **Affin Koordinat Transformasiyası (Affine Coordinate Transformation):** Koordinatları xətti cəbrin Affin çevrilmələri (döndərmə, miqyaslama, sürüşdürmə) vasitəsilə yeni bir müstəviyə köçürür.
5.  **Logarifmik Spiral Yerdəyişməsi (Logarithmic Spiral Displacement):** Təbiətdə tez-tez rast gəlinən logarifmik spiral formuluna əsaslanaraq koordinatlara son bir yerdəyişmə tətbiq edir.

Bu şifrələmə mühərriki aşağıdakı bütün proseslərdə tətbiq olunur:
*   **Koordinatların Təhlükəsizliyi:** Bütün bölüklərin real mövqeləri bu alqoritmlərlə şifrələnərək ötürülür.
*   **Yem Hədəf Yaratma (Decoy Generation):** Düşmən kəşfiyyatını yanıltmaq üçün yaradılan saxta koordinatlar (yemlər) məhz bu alqoritmlərin nəticəsidir.

#### Deşifrələmə (Decryption)
Deşifrələmə prosesi yuxarıdakı 5 addımın **tam tərs ardıcıllıqla və hər birinin riyazi tərs əməliyyatı** ilə aparılmasıdır. Sistem `Logarifmik Spiral` addımından başlayaraq `Kollats Fərziyyəsi` addımına doğru geri qayıdır və hər mərhələdə tətbiq olunan transformasiyanı ləğv edir. Doğru açar söz istifadə edildikdə, sonda orijinal koordinatlar tamamilə bərpa olunur.

### 2. Mesajların Şifrələnməsi: 3-Mərhələli Simvol Çevrilməsi
Daxili kommunikasiya və mesajlaşma sistemindəki məlumatların məxfiliyini təmin etmək üçün hər bir simvol fərdi şəkildə 3 mərhələli riyazi alqoritmdən keçirilərək şifrələnir.

**Nümunə:** Orijinal mesaj: `"salam"`

#### Şifrələmə Addımları (Encryption)
Mesajdakı hər bir simvol üçün aşağıdakı proses təkrarlanır:

1.  **Affin Transformasiyası:** Simvolun ASCII dəyəri (`x`) `x1 = (7 * x) + 13` düsturu ilə çevrilir.
2.  **Modulyar Arifmetika:** Alınan nəticə (`x1`) 256-ya bölünərək qalığı tapılır: `x2 = x1 % 256`. Bu, nəticənin həmişə 0-255 aralığında qalmasını təmin edir.
3.  **Mövqe Əsaslı Qarışdırma:** Simvolun mesajdakı mövqeyinin (`i`) kvadratı nəticəyə əlavə olunur: `x3 = x2 + i²`. Bu, eyni hərflərin fərqli mövqelərdə fərqli şifrələnməsini təmin edir.

**Nümunə Hesablama (`"salam"`):**
*   **'s' (i=0):** `((7 * 115) + 13) % 256 + 0² = 58`
*   **'a' (i=1):** `((7 * 97) + 13) % 256 + 1² = 185`
*   **'l' (i=2):** `((7 * 108) + 13) % 256 + 2² = 249`
*   **'a' (i=3):** `((7 * 97) + 13) % 256 + 3² = 193`
*   **'m' (i=4):** `((7 * 109) + 13) % 256 + 4² = 36`

**Son Şifrəli Nəticə (Verilənlər bazasına yazılan):** `[58, 185, 249, 193, 36]`

#### Deşifrələmə (Decryption)
Deşifrələmə tərs əməliyyatlarla aparılır:

1.  **Mövqe Təsirini Silmək:** `x2 = x3 - i²`
2.  **Affin Transformasiyasının Tərsi:** `x = (a⁻¹ * (x2 - b)) % 256`. Burada `a⁻¹` modular tərsdir (bizim halda `7⁻¹ mod 256 = 183`).

Bu əməliyyatlar nəticəsində orijinal ASCII kodu bərpa edilir və `[58, 185, 249, 193, 36]` massivi yenidən `"salam"` sözünə çevrilir.

### 3. Əməliyyat Zəncirinin Optimizasiyası: Deykstra Alqoritmi
GeoShield, sadəcə nöqtələri birləşdirmir, həm də onlar arasındakı ən optimal yolu riyazi olaraq hesablayır. Bu proses üçün qraf nəzəriyyəsinin fundamental alqoritmlərindən olan **Deykstra alqoritmi (Dijkstra's Algorithm)** istifadə olunur.

*   **Riyazi Model:** Xəritədəki "Qərargah" nişanları başlanğıc nöqtələri, "Hədəf" nişanları isə son nöqtələr kimi qəbul edilir. Alqoritm bu nöqtələr arasındakı ən qısa yolu tapmaq üçün onları bir qrafın təpə nöqtələri kimi modelləşdirir. Hələlik, nöqtələr arasındakı məsafə (ağırlıq) Evklid məsafəsi ilə hesablanır.
*   **Tətbiqi:** Komandir "Əməliyyat Zənciri Hesabla" düyməsinə basdıqda, sistem xəritədəki hər bir qərargahdan hər bir hədəfə doğru ən qısa marşrutu Deykstra alqoritmi vasitəsilə hesablayır və vizual olaraq xəritədə göstərir. Bu, komandanlığa bütün mümkün hücum və ya dəstək xətlərini eyni anda analiz etmək imkanı verir.

## İdarəetmə Panelləri
Sistemdə iki fərqli səlahiyyətli panel mövcuddur:

### 1. Baş Komandir Paneli (`/komandir`)
-   **Vahid Əməliyyat Mənzərəsi:** Bütün bölükləri, təyin edilmiş hədəfləri və yem nöqtələrini vahid xəritədə izləyir.
-   **Strateji İdarəetmə:** Yeni bölüklər və sub-komandirlər yaradır, onların icazələrini (məsələn, bütün xəritəni görmə səlahiyyəti) tənzimləyir.
-   **Kəşfiyyata Qarşı Mübarizə:** Xəritədə təyin etdiyi "aktiv" hədəflər üçün şifrələmə mühərrikini işə salaraq saxta yem hədəflər yaradır və onları ictimai xəritəyə ötürür.

### 2. Sub-Komandir Paneli (`/sub-komandir`)
-   **Məhdud və Fokuslanmış Məlumat:** Standart olaraq yalnız öz bölüyünü və ona təyin edilmiş hədəfləri görür. Baş komandirin icazəsi ilə digər bölükləri də izləyə bilər.
-   **Əməliyyat İcrası:** Təyin olunmuş hədəflərə fokuslanaraq əməliyyatları icra edir. Strateji qərarvermə, yeni bölük yaratma və şifrələmə funksiyalarına çıxışı yoxdur.

## Hesab Təhlükəsizliyi və Anomaliya Təsbiti
GeoShield, sadəcə məlumatları şifrələməklə kifayətlənmir, həm də hesabların təhlükəsizliyinə nəzarət edir.

-   **Anomaliya Təsbiti:** Sistem, bir hesaba eyni anda birdən çox cihazdan daxil olma cəhdini avtomatik olaraq **"potensial düşmən müdaxiləsi"** kimi qeydə alır.
-   **Gizli Monitorinq:** İkinci cihazdan daxil olan şəxs sistemin normal işlədiyini zənn edir, lakin onun bütün fəaliyyəti arxa planda izlənilir.
-   **Real-Zamanlı Xəbərdarlıq:** Müdaxilə baş verən anda baş komandirin panelində dərhal xəbərdarlıq görünür. Bu xəbərdarlıqda müdaxilənin vaxtı, cəhd edilən hesab, müdaxiləçinin IP ünvanı və təxmini coğrafi mövqeyi kimi kritik məlumatlar əks olunur. Bu, komandanlığa dərhal cavab tədbirləri görmək və təhlükəni zərərsizləşdirmək imkanı verir.
# final-geo
# protected-geo
