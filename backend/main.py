from __future__ import annotations

import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

USDA_API_KEY = os.getenv("USDA_API_KEY", "").strip()
USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

app = FastAPI(
    title="FITORA Food API",
    version="1.0.0",
    description="USDA FoodData Central verilerini FITORA için sadeleştiren backend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://erkisie.github.io",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

TURKISH_QUERY_MAP: dict[str, str] = {
    "yoğurt": "yogurt plain",
    "yogurt": "yogurt plain",
    "süzme yoğurt": "greek yogurt plain",
    "proteinli yoğurt": "high protein yogurt",
    "tavuk": "chicken breast cooked",
    "tavuk göğsü": "chicken breast cooked",
    "yumurta": "egg whole cooked",
    "yulaf": "oats",
    "pirinç": "rice cooked",
    "bulgur": "bulgur cooked",
    "muz": "banana raw",
    "elma": "apple raw",
    "süt": "milk",
    "peynir": "cheese",
    "lor": "cottage cheese",
    "mercimek": "lentils cooked",
    "nohut": "chickpeas cooked",
    "avokado": "avocado raw",
    "badem": "almonds",
}

NUTRIENT_NAMES = {
    "energy": {"Energy"},
    "protein": {"Protein"},
    "carbs": {"Carbohydrate, by difference"},
    "fat": {"Total lipid (fat)"},
}


def translate_query(query: str) -> str:
    normalized = query.casefold().strip()
    return TURKISH_QUERY_MAP.get(normalized, query.strip())


def nutrient_value(food: dict[str, Any], nutrient_names: set[str]) -> float:
    for nutrient in food.get("foodNutrients", []):
        name = nutrient.get("nutrientName")
        if name in nutrient_names:
            value = nutrient.get("value")
            if value is not None:
                return round(float(value), 2)
    return 0.0


def normalize_food(food: dict[str, Any]) -> dict[str, Any]:
    data_type = food.get("dataType", "")
    serving_size = food.get("servingSize")
    serving_unit = food.get("servingSizeUnit")

    return {
        "fdc_id": food.get("fdcId"),
        "name": food.get("description", "Unknown food").title(),
        "brand": food.get("brandOwner") or food.get("brandName"),
        "data_type": data_type,
        "serving_size": serving_size,
        "serving_unit": serving_unit,
        "basis": "100 g",
        "calories": nutrient_value(food, NUTRIENT_NAMES["energy"]),
        "protein": nutrient_value(food, NUTRIENT_NAMES["protein"]),
        "carbs": nutrient_value(food, NUTRIENT_NAMES["carbs"]),
        "fat": nutrient_value(food, NUTRIENT_NAMES["fat"]),
    }


@app.get("/api/health")
async def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "usda_key_configured": bool(USDA_API_KEY),
    }


@app.get("/api/foods/search")
async def search_foods(
    q: str = Query(..., min_length=2, max_length=80),
    page_size: int = Query(12, ge=1, le=25),
) -> dict[str, Any]:
    if not USDA_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="USDA_API_KEY ayarlanmamış. backend/.env dosyasını oluşturun.",
        )

    translated_query = translate_query(q)

    params = {
        "api_key": USDA_API_KEY,
        "query": translated_query,
        "pageSize": page_size,
        "dataType": ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{USDA_BASE_URL}/foods/search", params=params)
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="USDA servisi zaman aşımına uğradı.") from exc
    except httpx.HTTPStatusError as exc:
        detail = "USDA servisine erişilemedi."
        if exc.response.status_code in {401, 403}:
            detail = "USDA API anahtarı geçersiz veya yetkisiz."
        elif exc.response.status_code == 429:
            detail = "USDA API kullanım sınırı aşıldı."
        raise HTTPException(status_code=502, detail=detail) from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail="İnternet bağlantısı veya USDA servisi kullanılamıyor.") from exc

    payload = response.json()
    foods = [normalize_food(food) for food in payload.get("foods", [])]

    # Kullanıcıya anlamsız, tamamen boş kayıtlar göstermeyelim.
    foods = [
        food
        for food in foods
        if food["calories"] or food["protein"] or food["carbs"] or food["fat"]
    ]

    return {
        "original_query": q,
        "searched_query": translated_query,
        "total_hits": payload.get("totalHits", len(foods)),
        "foods": foods,
    }
