import os
from dotenv import load_dotenv

import mysql.connector

load_dotenv(override=True)


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("AQUANAV_MYSQL_HOST"),
        port=int(os.getenv("AQUANAV_MYSQL_PORT", "3306")),
        user=os.getenv("AQUANAV_MYSQL_USER"),
        password=os.getenv("AQUANAV_MYSQL_PASSWORD"),
        database=os.getenv("AQUANAV_MYSQL_DATABASE", "aquanav"),
        ssl_disabled=False
    )