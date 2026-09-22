from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from database import get_connection


app = FastAPI(
    title="AquaNav API",
    description="Backend API for AquaNav fishing application",
    version="1.0.0"
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "AquaNav API is running"
    }


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ---------------------------------------------------------
# REGISTER USER
# ---------------------------------------------------------

@app.post("/users")
def create_user(user: dict):

    user_id = user.get("user_id")
    name = user.get("name")
    password = user.get("password")

    if not user_id or not name or not password:
        raise HTTPException(
            status_code=400,
            detail="User ID, name and password are required."
        )

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Check whether user already exists
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User ID already exists."
            )

        # Hash password
        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO users
            (user_id, name, password)
            VALUES (%s, %s, %s)
            """,
            (
                user_id,
                name,
                hashed_password
            )
        )

        connection.commit()

        return {
            "message": "User registered successfully.",
            "user_id": user_id,
            "name": name
        }

    finally:
        cursor.close()
        connection.close()


# ---------------------------------------------------------
# LOGIN
# ---------------------------------------------------------

@app.post("/login")
def login(user: dict):

    user_id = user.get("user_id")
    password = user.get("password")

    if not user_id or not password:
        raise HTTPException(
            status_code=400,
            detail="User ID and password are required."
        )

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT id, user_id, name, password, created_at
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        existing_user = cursor.fetchone()

        if not existing_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid User ID or password."
            )

        stored_password = existing_user["password"]

        # -------------------------------------------------
        # BCRYPT PASSWORD
        # -------------------------------------------------

        if stored_password.startswith("$2b$"):

            password_valid = bcrypt.checkpw(
                password.encode("utf-8"),
                stored_password.encode("utf-8")
            )

            if not password_valid:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid User ID or password."
                )

        # -------------------------------------------------
        # OLD PLAIN-TEXT PASSWORD
        # -------------------------------------------------

        else:

            if password != stored_password:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid User ID or password."
                )

            # Automatically convert old password
            # into bcrypt
            new_hashed_password = bcrypt.hashpw(
                password.encode("utf-8"),
                bcrypt.gensalt()
            ).decode("utf-8")

            cursor.execute(
                """
                UPDATE users
                SET password = %s
                WHERE user_id = %s
                """,
                (
                    new_hashed_password,
                    user_id
                )
            )

            connection.commit()

        return {
            "message": "Login successful.",
            "user": {
                "id": existing_user["id"],
                "user_id": existing_user["user_id"],
                "name": existing_user["name"],
                "created_at": existing_user["created_at"]
            }
        }

    finally:
        cursor.close()
        connection.close()


# ---------------------------------------------------------
# GET USER PROFILE
# ---------------------------------------------------------

@app.get("/users/{user_id}")
def get_user(user_id: str):

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                name,
                created_at
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        return user

    finally:
        cursor.close()
        connection.close()


# ---------------------------------------------------------
# CREATE FISHING TRIP
# ---------------------------------------------------------

@app.post("/trips")
def create_trip(trip: dict):

    user_id = trip.get("user_id")
    date = trip.get("date")
    area = trip.get("area")
    quality = trip.get("quality")
    fuel = trip.get("fuel")

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required."
        )

    if not date:
        raise HTTPException(
            status_code=400,
            detail="Date is required."
        )

    if not area:
        raise HTTPException(
            status_code=400,
            detail="Fishing area is required."
        )

    if not quality:
        raise HTTPException(
            status_code=400,
            detail="Fishing quality is required."
        )

    if fuel is None:
        raise HTTPException(
            status_code=400,
            detail="Fuel value is required."
        )

    try:
        fuel_value = float(fuel)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Fuel must be a valid number."
        )

    if fuel_value <= 0:
        raise HTTPException(
            status_code=400,
            detail="Fuel must be greater than zero."
        )

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Check user exists
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        existing_user = cursor.fetchone()

        if not existing_user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        # Insert trip
        cursor.execute(
            """
            INSERT INTO fishing_trips
            (
                user_id,
                date,
                area,
                quality,
                fuel
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                user_id,
                date,
                area,
                quality,
                fuel_value
            )
        )

        connection.commit()

        trip_id = cursor.lastrowid

        return {
            "message": "Fishing trip added successfully.",
            "trip": {
                "id": trip_id,
                "user_id": user_id,
                "date": date,
                "area": area,
                "quality": quality,
                "fuel": fuel_value
            }
        }

    finally:
        cursor.close()
        connection.close()


# ---------------------------------------------------------
# GET USER'S TRIPS
# ---------------------------------------------------------

@app.get("/trips/{user_id}")
def get_trips(
    user_id: str,
    x_user_id: str | None = Header(default=None)
):

    # -----------------------------------------------------
    # SECURITY CHECK
    # -----------------------------------------------------

    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="X-User-ID header is required."
        )

    if x_user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own fishing trips."
        )

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Check user exists
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE user_id = %s
            """,
            (user_id,)
        )

        existing_user = cursor.fetchone()

        if not existing_user:
            raise HTTPException(
                status_code=404,
                detail="User not found."
            )

        # Get trips
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
            (user_id,)
        )

        trips = cursor.fetchall()

        return {
            "user_id": user_id,
            "trips": trips
        }

    finally:
        cursor.close()
        connection.close()


# ---------------------------------------------------------
# DELETE ONE TRIP
# ---------------------------------------------------------

@app.delete("/trips/{trip_id}")
def delete_trip(
    trip_id: int,
    x_user_id: str | None = Header(default=None)
):

    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="X-User-ID header is required."
        )

    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:

        # Find trip and verify ownership
        cursor.execute(
            """
            SELECT id, user_id
            FROM fishing_trips
            WHERE id = %s
            """,
            (trip_id,)
        )

        trip = cursor.fetchone()

        if not trip:
            raise HTTPException(
                status_code=404,
                detail="Fishing trip not found."
            )

        if trip["user_id"] != x_user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only delete your own fishing trip."
            )

        cursor.execute(
            """
            DELETE FROM fishing_trips
            WHERE id = %s
            """,
            (trip_id,)
        )

        connection.commit()

        return {
            "message": "Fishing trip deleted successfully."
        }

    finally:
        cursor.close()
        connection.close()


# ---------------------------------------------------------
# DELETE ALL USER TRIPS
# ---------------------------------------------------------

@app.delete("/trips/user/{user_id}")
def delete_all_trips(
    user_id: str,
    x_user_id: str | None = Header(default=None)
):

    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="X-User-ID header is required."
        )

    if x_user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own fishing trips."
        )

    connection = get_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM fishing_trips
            WHERE user_id = %s
            """,
            (user_id,)
        )

        deleted_count = cursor.rowcount

        connection.commit()

        return {
            "message": "All fishing trips deleted successfully.",
            "deleted_count": deleted_count
        }

    finally:
        cursor.close()
        connection.close()