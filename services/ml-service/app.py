from fastapi import FastAPI
import random

app = FastAPI()

@app.get("/recommend")
def recommend():
    items = ["Laptop Pro", "Căști Wireless", "Monitor 4K", "Tastatură Mecanică"]
    return {"recommendation": random.choice(items), "engine": "Python-ML-Model-v1"}

@app.get("/")
def health():
    return {"status": "ML Recommendation Engine Active"}
