from datetime import date, datetime
from decimal import Decimal
from typing import Optional

import bcrypt
import mysql.connector
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_connection


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(
    title="AquaNav API",
    description="Backend API for the AquaNav fishing application",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://aquanav-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Pydantic Models
# ============================================================

class UserCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=255)


class TripCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=50)
    date: date
    area: str = Field(min_length=1, max_length=50)
    quality: str = Field(min_length=1, max_length=20)
    fuel: float = Field(gt=0)


# ============================================================
# Helper Functions
# ============================================================

def serialize_value(value):
    """Convert MySQL values into JSON-friendly values."""
    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    return value


def serialize_user(row):
    """Convert a users table row into a dictionary."""
    if not row:
        return None

    return {
        "id": row[0],
        "user_id": row[1],
        "name": row[2],
        "created_at": serialize_value(row[4]),
    }


def serialize_trip(row):
    """Convert a fishing_trips table row into a dictionary."""
    return {
        "id": row[0],
        "user_id": row[1],
        "date": serialize_value(row[2]),
        "area": row[3],
        "quality": row[4],
        "fuel": serialize_value(row[5]),
        "created_at": serialize_value(row[6]),
    }


def get_user_by_id(user_id: str):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT id, user_id, name, password, created_at
            FROM users
            WHERE user_id = %s
            """,
            (user_id,),
        )

        return cursor.fetchone()

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


def check_trip_owner(requested_user_id: str, header_user_id: Optional[str]):
    """
    Ensure the user making the request owns the requested data.
    """

    if not header_user_id:
        raise HTTPException(
            status_code=403,
            detail="X-User-ID header is required.",
        )

    if header_user_id != requested_user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this user's data.",
        )


# ============================================================
# Root
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AquaNav API is running.",
        "status": "online",
    }


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


# ============================================================
# Create User / Register
# ============================================================

@app.post("/users")
def create_user(user: UserCreate):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # Check whether user already exists
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE user_id = %s
            """,
            (user.user_id,),
        )

        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User ID already exists.",
            )

        # Hash password
        hashed_password = bcrypt.hashpw(
            user.password.encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO users (user_id, name, password)
            VALUES (%s, %s, %s)
            """,
            (
                user.user_id,
                user.name,
                hashed_password,
            ),
        )

        connection.commit()

        new_user_id = cursor.lastrowid

        return {
            "message": "User registered successfully.",
            "user": {
                "id": new_user_id,
                "user_id": user.user_id,
                "name": user.name,
            },
        }

    except mysql.connector.Error as error:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}",
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# Login
# ============================================================

@app.post("/login")
def login(login_data: LoginRequest):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT id, user_id, name, password, created_at
            FROM users
            WHERE user_id = %s
            """,
            (login_data.user_id,),
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid User ID or password.",
            )

        stored_password = user[3]

        password_valid = False
        password_was_legacy_plaintext = False

        # ----------------------------------------------------
        # Normal bcrypt password
        # ----------------------------------------------------

        try:
            password_valid = bcrypt.checkpw(
                login_data.password.encode("utf-8"),
                stored_password.encode("utf-8"),
            )

        except (ValueError, TypeError):
            password_valid = False

        # ----------------------------------------------------
        # Legacy plaintext password support
        # ----------------------------------------------------

        if not password_valid and login_data.password == stored_password:
            password_valid = True
            password_was_legacy_plaintext = True

        if not password_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid User ID or password.",
            )

        # ----------------------------------------------------
        # Automatically upgrade old plaintext password
        # ----------------------------------------------------

        if password_was_legacy_plaintext:
            new_hashed_password = bcrypt.hashpw(
                login_data.password.encode("utf-8"),
                bcrypt.gensalt(),
            ).decode("utf-8")

            cursor.execute(
                """
                UPDATE users
                SET password = %s
                WHERE user_id = %s
                """,
                (
                    new_hashed_password,
                    login_data.user_id,
                ),
            )

            connection.commit()

        return {
            "message": "Login successful.",
            "user": serialize_user(user),
        }

    except mysql.connector.Error as error:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}",
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# Get User Profile
# ============================================================

@app.get("/users/{user_id}")
def get_user(
    user_id: str,
    x_user_id: Optional[str] = Header(default=None),
):
    check_trip_owner(user_id, x_user_id)

    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return {
        "user": serialize_user(user),
    }


# ============================================================
# Create Fishing Trip
# ============================================================

@app.post("/trips")
def create_trip(
    trip: TripCreate,
    x_user_id: Optional[str] = Header(default=None),
):
    check_trip_owner(trip.user_id, x_user_id)

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # Check user exists
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE user_id = %s
            """,
            (trip.user_id,),
        )

        user_exists = cursor.fetchone()

        if not user_exists:
            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        # Validate quality
        allowed_quality = {
            "GOOD",
            "AVERAGE",
            "POOR",
        }

        if trip.quality.upper() not in allowed_quality:
            raise HTTPException(
                status_code=400,
                detail="Quality must be GOOD, AVERAGE, or POOR.",
            )

        # Validate area
        allowed_areas = {
            "ZONE_A",
            "ZONE_B",
            "ZONE_C",
            "ZONE_D",
            "ZONE_E",
        }

        if trip.area.upper() not in allowed_areas:
            raise HTTPException(
                status_code=400,
                detail="Invalid fishing area.",
            )

        cursor.execute(
            """
            INSERT INTO fishing_trips
            (user_id, date, area, quality, fuel)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                trip.user_id,
                trip.date,
                trip.area.upper(),
                trip.quality.upper(),
                trip.fuel,
            ),
        )

        connection.commit()

        trip_id = cursor.lastrowid

        return {
            "message": "Fishing trip saved successfully.",
            "trip": {
                "id": trip_id,
                "user_id": trip.user_id,
                "date": trip.date.isoformat(),
                "area": trip.area.upper(),
                "quality": trip.quality.upper(),
                "fuel": trip.fuel,
            },
        }

    except mysql.connector.Error as error:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}",
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# Get Fishing Trips
# ============================================================

@app.get("/trips/{user_id}")
def get_trips(
    user_id: str,
    x_user_id: Optional[str] = Header(default=None),
):
    check_trip_owner(user_id, x_user_id)

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                date,
                area,
                quality,
                fuel,
                created_at
            FROM fishing_trips
            WHERE user_id = %s
            ORDER BY date DESC, id DESC
            """,
            (user_id,),
        )

        rows = cursor.fetchall()

        trips = [
            serialize_trip(row)
            for row in rows
        ]

        return trips

    except mysql.connector.Error as error:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}",
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# Delete Single Trip
# ============================================================

@app.delete("/trips/{trip_id}")
def delete_trip(
    trip_id: int,
    x_user_id: Optional[str] = Header(default=None),
):
    if not x_user_id:
        raise HTTPException(
            status_code=403,
            detail="X-User-ID header is required.",
        )

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        # Verify trip ownership
        cursor.execute(
            """
            SELECT user_id
            FROM fishing_trips
            WHERE id = %s
            """,
            (trip_id,),
        )

        trip = cursor.fetchone()

        if not trip:
            raise HTTPException(
                status_code=404,
                detail="Trip not found.",
            )

        if trip[0] != x_user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to delete this trip.",
            )

        cursor.execute(
            """
            DELETE FROM fishing_trips
            WHERE id = %s
            """,
            (trip_id,),
        )

        connection.commit()

        return {
            "message": "Trip deleted successfully.",
        }

    except mysql.connector.Error as error:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}",
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# Delete All Trips For User
# ============================================================

@app.delete("/trips/user/{user_id}")
def delete_all_trips(
    user_id: str,
    x_user_id: Optional[str] = Header(default=None),
):
    check_trip_owner(user_id, x_user_id)

    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM fishing_trips
            WHERE user_id = %s
            """,
            (user_id,),
        )

        deleted_count = cursor.rowcount

        connection.commit()

        return {
            "message": "All trips deleted successfully.",
            "deleted_count": deleted_count,
        }

    except mysql.connector.Error as error:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(error)}",
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()