import { getFirestore, collection } from 'firebase/firestore';
import { app } from './firebase';

// Initialize Firestore
export const db = getFirestore(app);

// Collection References
export const collectionsRef = {
  users: collection(db, 'users'),
  universities: collection(db, 'universities'),
  programs: collection(db, 'programs'),
  applications: collection(db, 'applications'),
};

// Schema Definitions (for validation)
export const schemas = {
  university: {
    required: ['name', 'location', 'type', 'website'],
    properties: {
      name: String,
      description: String,
      type: String, // public/private
      ranking: Number,
      location: {
        city: String,
        province: String,
        address: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      },
      website: String,
      contactInfo: {
        email: String,
        phone: String,
        socialMedia: {
          facebook: String,
          twitter: String,
          linkedin: String
        }
      },
      facilities: [String],
      accreditation: [String],
      establishedYear: Number,
      lastUpdated: Date,
      isActive: Boolean
    }
  },
  program: {
    required: ['name', 'universityId', 'degreeLevel', 'duration'],
    properties: {
      universityId: String,
      name: String,
      degreeLevel: String, // Bachelors, Masters, PhD
      fieldOfStudy: String,
      duration: {
        years: Number,
        semesters: Number
      },
      description: String,
      admissionRequirements: {
        minimumGPA: Number,
        requiredTests: [String],
        documents: [String],
        additionalRequirements: String
      },
      fees: {
        tuitionFee: Number,
        applicationFee: Number,
        otherFees: [{
          name: String,
          amount: Number
        }],
        currency: String,
        perSemester: Boolean
      },
      deadlines: {
        applicationStart: Date,
        applicationEnd: Date,
        programStart: Date
      },
      quota: Number,
      isActive: Boolean,
      lastUpdated: Date
    }
  },
  application: {
    required: ['userId', 'programId', 'universityId', 'status'],
    properties: {
      userId: String,
      programId: String,
      universityId: String,
      status: String, // pending, submitted, under-review, accepted, rejected
      documents: [{
        type: String,
        name: String,
        url: String,
        uploadedAt: Date,
        status: String // pending, approved, rejected
      }],
      applicationData: {
        personalInfo: {
          fullName: String,
          dateOfBirth: Date,
          nationality: String,
          passportNumber: String
        },
        academicInfo: {
          previousDegree: String,
          institution: String,
          gpa: Number,
          graduationYear: Number
        },
        testScores: [{
          testName: String,
          score: Number,
          dateObtained: Date
        }]
      },
      timeline: [{
        status: String,
        date: Date,
        notes: String
      }],
      submittedAt: Date,
      updatedAt: Date,
      notes: String
    }
  },
  user: {
    required: ['email', 'name'],
    properties: {
      email: String,
      name: String,
      educationLevel: String,
      academicInterest: String,
      province: String,
      grades: String,
      profile: {
        phoneNumber: String,
        dateOfBirth: Date,
        gender: String,
        nationality: String,
        currentEducation: {
          level: String,
          institution: String,
          major: String,
          gpa: Number
        }
      },
      preferences: {
        preferredLocations: [String],
        preferredPrograms: [String],
        maxFee: Number,
        studyLevel: String
      },
      documents: [{
        type: String,
        url: String,
        uploadedAt: Date
      }],
      emailVerified: Boolean,
      role: String, // user, admin
      createdAt: Date,
      updatedAt: Date,
      lastLogin: Date
    }
  }
}; 