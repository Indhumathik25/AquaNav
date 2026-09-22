import os
import mysql.connector


def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password=os.getenv("AQUANAV_MYSQL_PASSWORD"),
        database="aquanav"
    )