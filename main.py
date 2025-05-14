from fastapi import FastAPI
from routes import save_es, rec_es, delete_es
from fastapi.middleware.cors import CORSMiddleware
import logging

app = FastAPI()

logging.basicConfig(level=logging.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok"}

app.include_router(save_es.router)
app.include_router(delete_es.router)
app.include_router(rec_es.router)
