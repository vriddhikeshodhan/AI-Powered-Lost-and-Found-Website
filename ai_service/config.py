import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "lostfound")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Matching thresholds
TEXT_SIMILARITY_THRESHOLD = float(os.getenv("TEXT_THRESHOLD", "0.5"))
IMAGE_SIMILARITY_THRESHOLD = float(os.getenv("IMAGE_THRESHOLD", "0.5"))

# Weight of text vs image in final score
TEXT_WEIGHT = 0.6
IMAGE_WEIGHT = 0.4

# How many top matches to return
TOP_K = 3

# Port this service runs on
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))