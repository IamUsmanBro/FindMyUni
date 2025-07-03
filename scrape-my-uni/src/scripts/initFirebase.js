const initializeCollections = require('../firebase/initCollections.js');

// Run the initialization
initializeCollections()
  .then(() => {
    console.log('Firebase collections initialized successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to initialize collections:', error);
    process.exit(1);
  }); 