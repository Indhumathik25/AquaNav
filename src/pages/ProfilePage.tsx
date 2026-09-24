
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import BottomNav from "../components/BottomNav.tsx"

const API_URL = "https://aquanav-backend.onrender.com"

type User = {
  id: number
  user_id: string
  name: string
  created_at: string
}

type Trip = {
  id: number
  user_id: string
  date: string
  area: string
  quality: string
  fuel: number
  created_at: string
}

function ProfilePage() {
  const navigate = useNavigate()

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  )

  const userId = currentUser?.user_id

  const [user, setUser] = useState<User | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) {
      navigate("/login")
      return
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true)
        setError("")

        // Get profile
        const userResponse = await fetch(
          `${API_URL}/users/${userId}`,
          {
            headers: {
              "X-User-ID": userId,
            },
          }
        )

        const userData = await userResponse.json()

        if (!userResponse.ok) {
          setError(
            userData.detail ||
              "Unable to load profile."
          )
          return
        }

        setUser(userData)

        // Get fishing trips
        const tripsResponse = await fetch(
          `${API_URL}/trips/${userId}`,
          {
            headers: {
              "X-User-ID": userId,
            },
          }
        )

        const tripsData = await tripsResponse.json()

        if (!tripsResponse.ok) {
          setError(
            tripsData.detail ||
              "Unable to load fishing history."
          )
          return
        }

        setTrips(
          Array.isArray(tripsData)
            ? tripsData
            : tripsData.trips || []
        )
      } catch (error) {
        console.error("Profile error:", error)

        setError(
          "Unable to connect to AquaNav server. Make sure FastAPI is running."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [userId, navigate])

  const zoneCounts: Record<string, number> = {}

  trips.forEach((trip) => {
    zoneCounts[trip.area] =
      (zoneCounts[trip.area] || 0) + 1
  })

  const favoriteZone =
    Object.entries(zoneCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "—"

  const formattedFavoriteZone =
    favoriteZone === "—"
      ? "—"
      : favoriteZone.replace("_", " ")

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("currentUserName")
    navigate("/login")
  }

  if (loading) {
    return (
      <main className="profile-page">
        <header className="page-header">
          <p className="dashboard-label">
            AQUANAV
          </p>

          <h1>
            My Profile
          </h1>

          <p>
            Loading your account...
          </p>
        </header>

        <section className="profile-card">
          <div className="profile-avatar">
            ⚓
          </div>

          <h2>
            Loading...
          </h2>

          <p className="profile-user-id">
            Please wait
          </p>
        </section>

        <BottomNav />
      </main>
    )
  }

  return (
    <main className="profile-page">
      <header className="page-header">
        <p className="dashboard-label">
          AQUANAV
        </p>

        <h1>
          My Profile
        </h1>

        <p>
          Manage your AquaNav account.
        </p>
      </header>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <section className="profile-card">
        <div className="profile-avatar">
          ⚓
        </div>

        <h2>
          {user?.name ||
            currentUser?.name ||
            "Fisherman"}
        </h2>

        <p className="profile-user-id">
          User ID:{" "}
          {user?.user_id ||
            currentUser?.user_id}
        </p>
      </section>

      <section className="profile-info">
        <div className="profile-row">
          <span>
            Account Type
          </span>

          <strong>
            Fisherman Account
          </strong>
        </div>

        <div className="profile-row">
          <span>
            Total Trips
          </span>

          <strong>
            {trips.length}
          </strong>
        </div>

        <div className="profile-row">
          <span>
            Favorite Zone
          </span>

          <strong>
            {formattedFavoriteZone}
          </strong>
        </div>
      </section>

      <button
        className="profile-logout"
        onClick={handleLogout}
      >
        Logout
      </button>

      <BottomNav />
    </main>
  )
}

export default ProfilePage

