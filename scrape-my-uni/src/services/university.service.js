import { db } from "../config/firestore"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore"

class UniversityService {
  constructor() {
    this.collection = collection(db, "universities")
  }

  // Get all universities with optional filters
  async getUniversities(filters = {}) {
    try {
      let q = this.collection

      // Apply filters
      if (filters.province) {
        q = query(q, where("location.province", "==", filters.province))
      }
      if (filters.type) {
        q = query(q, where("type", "==", filters.type))
      }
      if (filters.ranking) {
        q = query(q, orderBy("ranking"))
      }
      if (filters.limit) {
        q = query(q, limit(filters.limit))
      }

      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting universities:", error)
      throw error
    }
  }

  // Get a single university by ID
  async getUniversity(id) {
    try {
      const docRef = doc(this.collection, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        }
      } else {
        throw new Error("University not found")
      }
    } catch (error) {
      console.error("Error getting university:", error)
      throw error
    }
  }

  // Get a single university by ID (alias for getUniversity for consistency)
  async getById(id) {
    return this.getUniversity(id)
  }

  // Get all universities
  async getAll() {
    try {
      const snapshot = await getDocs(this.collection)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting all universities:", error)
      throw error
    }
  }

  // Search universities
  async search(searchTerm, filters = {}) {
    try {
      // Note: Firestore doesn't support text search directly
      // This is a basic implementation
      const snapshot = await getDocs(this.collection)
      const universities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return universities.filter((uni) => {
        const matchesSearch =
          uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          uni.description?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilters = Object.entries(filters).every(([key, value]) => {
          if (!value) return true
          if (key === "province") return uni.location?.province === value
          if (key === "type") return uni.type === value
          return true
        })

        return matchesSearch && matchesFilters
      })
    } catch (error) {
      console.error("Error searching universities:", error)
      throw error
    }
  }

  // Get university programs
  async getUniversityPrograms(universityId) {
    try {
      const programsCollection = collection(db, "programs")
      const q = query(programsCollection, where("universityId", "==", universityId))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting university programs:", error)
      throw error
    }
  }

  // Add a new university
  async addUniversity(data) {
    try {
      const docRef = await addDoc(this.collection, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding university:", error)
      throw error
    }
  }

  // Update a university
  async updateUniversity(id, data) {
    try {
      const docRef = doc(this.collection, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      })
      return true
    } catch (error) {
      console.error("Error updating university:", error)
      throw error
    }
  }

  // Delete a university
  async deleteUniversity(id) {
    try {
      const docRef = doc(this.collection, id)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error("Error deleting university:", error)
      throw error
    }
  }

  // Get top universities
  async getTopUniversities(limit = 10) {
    try {
      const q = query(this.collection, orderBy("ranking"), limit(limit))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error getting top universities:", error)
      throw error
    }
  }
}

export const universityService = new UniversityService()
