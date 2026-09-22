
import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = "http://127.0.0.1:8000"

export default function LogTripPage() {
  const navigate = useNavigate()

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  )

  const [date, setDate] = useState("")
  const [area, setArea] = useState("ZONE_A")
  const [quality, setQuality] = useState("GOOD")
  const [fuel, setFuel] = useState("")

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!currentUser) {
      navigate("/login")
      return
    }

    if (!date || !area || !quality || !fuel) {
      setError("Please fill in all fields.")
      return
    }

    if (Number(fuel) <= 0) {
      setError("Fuel must be greater than 0.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          date,
          area,
          quality,
          fuel: Number(fuel),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.detail || "Unable to save fishing trip."
        )
        return
      }

      setSuccess("Fishing trip saved successfully!")

      setDate("")
      setArea("ZONE_A")
      setQuality("GOOD")
      setFuel("")

      setTimeout(() => {
        navigate("/history")
      }, 1000)
    } catch (error) {
      console.error("Trip error:", error)

      setError(
        "Unable to connect to AquaNav server. Make sure FastAPI is running."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="log-trip-page">
      <header className="page-header log-trip-header">
        <p className="dashboard-label">AQUANAV</p>

        <h1>Log Fishing Trip</h1>

        <p>Record your latest fishing activity.</p>
      </header>

      <section className="log-trip-card">
        <form
          className="log-trip-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="date">
              Fishing Date
            </label>

            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              onClick={(event) =>
                event.currentTarget.showPicker?.()
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="area">
              Area Visited
            </label>

            <select
              id="area"
              value={area}
              onChange={(event) =>
                setArea(event.target.value)
              }
            >
              <option value="ZONE_A">ZONE_A</option>
              <option value="ZONE_B">ZONE_B</option>
              <option value="ZONE_C">ZONE_C</option>
              <option value="ZONE_D">ZONE_D</option>
              <option value="ZONE_E">ZONE_E</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quality">
              Catch Quality
            </label>

            <select
              id="quality"
              value={quality}
              onChange={(event) =>
                setQuality(event.target.value)
              }
            >
              <option value="GOOD">GOOD</option>
              <option value="AVERAGE">AVERAGE</option>
              <option value="POOR">POOR</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fuel">
              Fuel Used (Liters)
            </label>

            <input
              id="fuel"
              type="number"
              min="0.1"
              step="0.1"
              value={fuel}
              onChange={(event) =>
                setFuel(event.target.value)
              }
              placeholder="Example: 10"
            />
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="log-trip-submit"
            disabled={loading}
          >
            {loading
              ? "Saving Trip..."
              : "Save Fishing Trip"}
          </button>
        </form>
      </section>
    </main>
  )
}