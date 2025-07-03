"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { universityService } from "../services/api.service"
// Import Chip from Material UI
import { Chip } from "@mui/material"

const UniversityDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [university, setUniversity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchUniversityDetails()
    } else {
      setError("Invalid university ID")
      setLoading(false)
    }
  }, [id])

  const fetchUniversityDetails = async () => {
    try {
      setLoading(true)
      const data = await universityService.getById(id)
      if (!data) {
        throw new Error("University not found")
      }
      setUniversity(data)
    } catch (err) {
      setError("Failed to fetch university details: " + (err.message || "Unknown error"))
      console.error("Error fetching university:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyClick = () => {
    // If the university has an apply_link, redirect directly to that URL
    if (university && university.apply_link) {
      // Open the link in a new tab
      window.open(university.apply_link, '_blank');
    } else {
      // Fallback to the original behavior if no apply_link is available
      if (currentUser) {
        navigate(`/apply/${id}`);
      } else {
        navigate("/login", { state: { from: `/universities/${id}` } });
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Contact university"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (e) {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate("/universities")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Universities
        </button>
      </div>
    )
  }

  if (!university) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-gray-500 mb-4">University not found</div>
        <button
          onClick={() => navigate("/universities")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Universities
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="lg:container px-4 w-full lg:grid lg:grid-cols-12">
        <div className="University_Data lg:col-span-9 mt-12 flex flex-col gap-8 mb-12">
          <div className="text-center">
            <h1 className="max-sm:text-base sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-2">
              {university.name}
            </h1>
            {university.admissionOpen && (
              <Chip 
                label="Admission Open" 
                color="success" 
                size="medium"
                sx={{ fontWeight: 'medium' }}
              />
            )}
          </div>

          <div className="w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] border mx-auto">
            <table className="min-w-full border-collapse border border-primary text-primary font-semibold">
              <tbody>
                <tr>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    Location
                  </td>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    {university.location || 
                     (university.basic_info && university.basic_info.Location) || 
                     "Not specified"}
                    {university.province ? `, ${university.province}` : ""}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    Sector
                  </td>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    {university.sector || 
                     (university.basic_info && university.basic_info.Sector) || 
                     "Not specified"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    Affiliation
                  </td>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    {university.affiliation || 
                     (university.basic_info && university.basic_info.Affiliation) || 
                     "Not specified"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg">
                    Deadline to Apply
                  </td>
                  <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-primary text-center max-sm:text-xs md:text-base lg:text-lg text-red-600 font-semibold">
                    {formatDate(university.deadline || 
                               (university.basic_info && university.basic_info["Deadline to Apply"]))}
                  </td>
                </tr>
                {university.testDate && (
                  <tr>
                    <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-gray-400 dark:border-black text-center max-sm:text-xs md:text-base lg:text-lg">
                      Test Dates
                    </td>
                    <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-gray-400 dark:border-black text-center max-sm:text-xs md:text-base lg:text-lg">
                      {formatDate(university.testDate)}
                    </td>
                  </tr>
                )}
                {university.ranking && (
                  <tr>
                    <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-gray-400 dark:border-black text-center max-sm:text-xs md:text-base lg:text-lg">
                      Ranking
                    </td>
                    <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-gray-400 dark:border-black text-center max-sm:text-xs md:text-base lg:text-lg">
                      {university.ranking}
                    </td>
                  </tr>
                )}
                {university.foundedYear && (
                  <tr>
                    <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-gray-400 dark:border-black text-center max-sm:text-xs md:text-base lg:text-lg">
                      Founded
                    </td>
                    <td className="px-4 max-sm:py-2 md:py-3 xl:py-4 border border-gray-400 dark:border-black text-center max-sm:text-xs md:text-base lg:text-lg">
                      {university.foundedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* University Description */}
          {university.description && (
            <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto">
              <h2 className="text-xl font-bold mb-4">About {university.name}</h2>
              <p className="text-gray-700">{university.description}</p>
            </div>
          )}

          {/* Programs Section */}
          {university.programs && university.programs.length > 0 && (
            <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto">
              <h2 className="text-xl font-bold mb-4">Available Programs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {university.programs.map((program, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                    <h3 className="font-medium">{program.name || program}</h3>
                    {program.level && <p className="text-sm text-gray-600">{program.level}</p>}
                    {program.duration && <p className="text-sm text-gray-500">Duration: {program.duration}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements Section */}
          {university.requirements && university.requirements.length > 0 && (
            <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto">
              <h2 className="text-xl font-bold mb-4">Admission Requirements</h2>
              <ul className="list-disc pl-5 space-y-2">
                {university.requirements.map((requirement, index) => (
                  <li key={index} className="text-gray-700">
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Apply Button */}
          <div className="mt-8 w-[320px] sm:w-[600px] md:w-[650px] xl:w-[800px] mx-auto text-center">
            <button
              onClick={handleApplyClick}
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-bold"
            >
              Apply Now
            </button>
          </div>
        </div>

        {/* Sidebar could be added here in the remaining 3 columns */}
        <div className="lg:col-span-3 mt-12">{/* Sidebar content */}</div>
      </div>
    </div>
  )
}

export default UniversityDetail
