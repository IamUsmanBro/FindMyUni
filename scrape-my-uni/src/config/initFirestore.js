import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

const initializeFirestore = async () => {
  try {
    console.log('Starting Firestore initialization...');

    // Check if collections already exist
    const universitiesSnapshot = await getDocs(collection(db, 'universities'));
    if (!universitiesSnapshot.empty) {
      console.log('Collections already exist. Skipping initialization.');
      return;
    }

    console.log('Creating sample data...');

    // Create sample universities with updated structure
    const universities = [
      {
        name: 'University of Karachi',
        description: 'University of Karachi is a public research university located in Karachi, Sindh, Pakistan.',
        url: 'https://uok.edu.pk/',
        apply_link: 'https://uok.edu.pk/admissions/',
        admissionOpen: true,
        basic_info: {
          'Location': 'Karachi, Sindh',
          'Sector': 'Govt',
          'Deadline to Apply': '31 December 2024'
        },
        programs: {
          'UndergraduatePrograms': [
            'Computer Science',
            'Business Administration',
            'Engineering'
          ]
        },
        scraped_at: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: 'Lahore University of Management Sciences',
        description: 'LUMS is one of Pakistan\'s leading private research universities located in Lahore.',
        url: 'https://lums.edu.pk/',
        apply_link: 'https://lums.edu.pk/admissions/',
        admissionOpen: true,
        basic_info: {
          'Location': 'Lahore, Punjab',
          'Sector': 'Private',
          'Deadline to Apply': '31 December 2024'
        },
        programs: {
          'UndergraduatePrograms': [
            'Computer Science',
            'Business Administration',
            'Economics'
          ]
        },
        scraped_at: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    console.log('Adding data to Firestore...');

    // Add data to Firestore
    const universitiesRef = collection(db, 'universities');

    // Add universities
    for (const university of universities) {
      const docRef = await addDoc(universitiesRef, university);
      console.log('Added university with ID:', docRef.id);
    }

    console.log('Firestore initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
};

export default initializeFirestore; 