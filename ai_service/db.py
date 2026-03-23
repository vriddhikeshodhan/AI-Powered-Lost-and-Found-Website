import psycopg
from psycopg.rows import dict_row
from pgvector.psycopg import register_vector
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

def get_connection():
    conn = psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        row_factory=dict_row  # psycopg3 equivalent of RealDictCursor
    )
    register_vector(conn)
    return conn