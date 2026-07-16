# FITORA V6 — Gerçek İnternet Besin Araması

Bu sürüm, FastAPI backend üzerinden USDA FoodData Central API'sini kullanarak gerçek besin sonuçları getirir.

## Ne yapar?

- Kullanıcı `yoğurt`, `tavuk`, `yulaf` gibi bir besin arar.
- Backend Türkçe sorguyu uygun İngilizce sorguya dönüştürür.
- USDA sonuçları 100 gram başına kalori, protein, karbonhidrat ve yağ ile gösterilir.
- Kullanıcı gram miktarını girer.
- FITORA tüm değerleri otomatik hesaplayıp seçili güne ekler.
- USDA API anahtarı frontend kodunda görünmez.

## 1. USDA API anahtarı alın

FoodData Central API anahtarı oluşturma sayfasından ücretsiz bir anahtar alın.

## 2. Backend `.env` dosyasını oluşturun

`backend` klasöründeki:

```text
.env.example
```

dosyasının kopyasını oluşturup adını:

```text
.env
```

yapın.

İçine anahtarınızı yazın:

```env
USDA_API_KEY=BURAYA_API_ANAHTARINIZ
```

## 3. Backend'i çalıştırın

Windows'ta `backend/run_backend.bat` dosyasına çift tıklayın.

Alternatif terminal komutları:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
fastapi dev main.py
```

Backend adresi:

```text
http://127.0.0.1:8000
```

API dokümantasyonu:

```text
http://127.0.0.1:8000/docs
```

## 4. Frontend'i çalıştırın

Ana FITORA klasörünü VS Code ile açın. `index.html` dosyasına sağ tıklayıp **Open with Live Server** seçin.

Genellikle frontend:

```text
http://127.0.0.1:5500
```

adresinde açılır.

## Klasör yapısı

```text
fitora-v6/
├── index.html
├── style.css
├── app.js
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── run_backend.bat
│   └── run_backend.ps1
└── README.md
```
