import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { app } from './firebaseConfig';

const db = getFirestore(app);

// Collection initialization functions
const initializeCollections = async () => {
  try {
    // Core collections - maintained after database cleanup

    // Initialize users collection
    const usersRef = collection(db, 'users');
    await setDoc(doc(usersRef, 'template'), {
      email: '',
      role: 'user',
      displayName: '',
      phoneNumber: '',
      bio: '',
      address: '',
      city: '',
      province: '',
      educationLevel: '',
      academicInterest: '',
      grades: '',
      notifications: {
        email: true,
        application: true,
        deadline: true,
        news: false
      },
      savedUniversities: [],
      photoURL: '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize universities collection
    const universitiesRef = collection(db, 'universities');
    await setDoc(doc(universitiesRef, 'template'), {
      name: '',
      description: '',
      url: '',
      apply_link: '',
      admissionOpen: true,
      basic_info: {
        Location: '',
        Sector: '',
        "Deadline to Apply": ''
      },
      programs: {},
      scraped_at: new Date(),
      updatedAt: new Date()
    });

    // Initialize applications collection
    const applicationsRef = collection(db, 'applications');
    await setDoc(doc(applicationsRef, 'template'), {
      userId: '',
      universityId: '',
      status: 'pending',
      program: '',
      notes: '',
      documents: [],
      submittedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize admins collection
    const adminsRef = collection(db, 'admins');
    await setDoc(doc(adminsRef, 'template'), {
      email: '',
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize scrape_jobs collection
    const scrapeJobsRef = collection(db, 'scrape_jobs');
    await setDoc(doc(scrapeJobsRef, 'template'), {
      status: 'pending',
      target: '',
      startedAt: null,
      completedAt: null,
      results: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize scrape_requests collection
    const scrapeRequestsRef = collection(db, 'scrape_requests');
    await setDoc(doc(scrapeRequestsRef, 'template'), {
      userId: '',
      universityUrl: '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('All core collections initialized successfully!');
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
};

export default initializeCollections; 