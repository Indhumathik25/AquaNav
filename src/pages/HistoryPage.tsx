import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import BottomNav from "../components/BottomNav.tsx"

const API_URL = "https://aquanav-backend.onrender.com"

type Trip = {
  id: number
  user_id: string
  date: string
  area: string
  quality: string
  fuel: number
  created_at: string
}

function HistoryPage() {
  const navigate = useNavigate()

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  )

  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_URL}/trips/${currentUser.user_id}`,
        {
          headers: {
            "X-User-ID": currentUser.user_id,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.detail || "Unable to load fishing history."
        )
        return
      }

     setTrips(Array.isArray(data) ? data : data.trips || [])

    } catch (error) {
      console.error("History error:", error)

      setError(
        "Unable to connect to AquaNav server."
      )
    } finally {
      setLoading(false)
    }
  }

  const deleteTrip = async (tripId: number) => {
    if (!currentUser) return

    const confirmed = window.confirm(
      "Are you sure you want to delete this fishing trip?"
    )

    if (!confirmed) return

    try {
      setError("")
      setMessage("")

      const response = await fetch(
        `${API_URL}/trips/${tripId}`,
        {
          method: "DELETE",
          headers: {
            "X-User-ID": currentUser.user_id,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.detail || "Unable to delete trip."
        )
        return
      }

      setMessage(
        "Fishing trip deleted successfully."
      )

      await fetchTrips()

    } catch (error) {
      console.error("Delete error:", error)

      setError(
        "Unable to connect to AquaNav server."
      )
    }
  }

  const clearAllHistory = async () => {
    if (!currentUser) return

    const confirmed = window.confirm(
      "Are you sure you want to delete ALL your fishing history?"
    )

    if (!confirmed) return

    try {
      setError("")
      setMessage("")

      const response = await fetch(
        `${API_URL}/trips/user/${currentUser.user_id}`,
        {
          method: "DELETE",
          headers: {
            "X-User-ID": currentUser.user_id,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.detail || "Unable to clear history."
        )
        return
      }

      setTrips([])

      setMessage(
        `${data.deleted_count || 0} fishing trip(s) deleted.`
      )

    } catch (error) {
      console.error("Clear history error:", error)

      setError(
        "Unable to connect to AquaNav server."
      )
    }
  }

  const formatZone = (zone: string) => {
    return zone.replace("_", " ")
  }

  const getQualityClass = (quality: string) => {
    return quality.toLowerCase()
  }

  if (loading) {
    return (
      <main className="history-page">

        <header className="page-header">
          <p className="dashboard-label">
            AQUANAV
          </p>

          <h1>
            Fishing History
          </h1>

          <p>
            Loading your fishing trips...
          </p>
        </header>

        <section className="history-empty">
          Loading...
        </section>

        <BottomNav />

      </main>
    )
  }

  return (
    <main className="history-page">

      <header className="page-header">

        <p className="dashboard-label">
          AQUANAV
        </p>

        <h1>
          Fishing History
        </h1>

        <p>
          Review your recorded fishing trips.
        </p>

      </header>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      {message && (
        <div className="auth-success">
          {message}
        </div>
      )}

      {trips.length > 0 && (
        <div className="history-actions">

          <button
            className="clear-history-button"
            onClick={clearAllHistory}
          >
            Clear All History
          </button>

        </div>
      )}

      {trips.length === 0 ? (

        <section className="history-empty">

          <div className="history-empty-icon">
            🎣
          </div>

          <h2>
            No fishing trips yet
          </h2>

          <p>
            Start recording your fishing trips to
            build your AquaNav history.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate("/log-trip")}
          >
            + Log Fishing Trip
          </button>

        </section>

      ) : (

        <section className="history-list">

          {trips.map((trip) => (

            <article
              className="history-card"
              key={trip.id}
            >

              <div className="history-card-top">

                <div>
                  <h2>
                    {formatZone(trip.area)}
                  </h2>

                  <p>
                    {trip.date}
                  </p>
                </div>

                <span
                  className={`quality-badge ${getQualityClass(
                    trip.quality
                  )}`}
                >
                  {trip.quality}
                </span>

              </div>

              <div className="history-fuel">

                <span>
                  Fuel Used
                </span>

                <strong>
                  {Number(trip.fuel).toFixed(1)} L
                </strong>

              </div>

              <button
                className="delete-trip-button"
                onClick={() => deleteTrip(trip.id)}
              >
                Delete Trip
              </button>

            </article>

          ))}

        </section>

      )}

      <BottomNav />

    </main>
  )
}

export default HistoryPage