from fastapi import FastAPI
import random

app = FastAPI()

@app.get("/recommend")
def get_recommendation():
    products = ["Tesla Model S", "MacBook Pro M3", "iPhone 15", "Sony WH-1000XM5"]
    return {"item": random.choice(products), "confidence": 0.98, "provider": "Python-ML-Node"}

@app.get("/")
def health():
    return {"status": "online", "role": "Algorithmic Recommendations"}
