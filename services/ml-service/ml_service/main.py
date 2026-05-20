from fastapi import FastAPI

app = FastAPI(title="ML Service")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-service"}
