require('dotenv').config() 
const mongoose = require("mongoose");

if (process.argv.length < 3) {
  console.log("Usage: node <script> <password>");
  process.exit(1);
}

const password = process.argv[2];

//const uri = `mongodb+srv://note:${password}@free0.conul.mongodb.net/phonebook?retryWrites=true&w=majority&appName=free0`;
const uri = process.env.MONGODB_URI;
// Function to connect to MongoDB with retries
async function connectWithRetry(maxRetries = 5, delay = 5000) {
  let retries = maxRetries;
  while (retries) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // Timeout for each connection attempt
      });
      console.log("Connected to MongoDB!");
      return;
    } catch (error) {
      console.error(`Connection failed. Retrying (${maxRetries - retries + 1}/${maxRetries})...`, error.message);
      retries -= 1;
      if (retries === 0) {
        console.error("Failed to connect after multiple attempts.");
        throw error;
      }
      await new Promise((res) => setTimeout(res, delay)); // Wait before retrying
    }
  }
}

// Main function to run the application
async function run() {
  try {
    // Attempt to connect with retries
    await connectWithRetry();

    // Define schema and model
    const personSchema = new mongoose.Schema({
      name: String,
      number: String,
    });

    const Person = mongoose.model("Person", personSchema);

    // Saving to database
    if (process.argv.length === 5) {
      const name = process.argv[3];
      const number = process.argv[4];
      const person = new Person({
        name,
        number,
      });

      await person.save();
      console.log(`added ${name} number ${number} to phonebook`);
      mongoose.connection.close();
    }

    // Fetching all documents
    if (process.argv.length === 3) {
      const result = await Person.find({});
      console.log("phonebook:");
      result.forEach((person) => {
        console.log(`${person.name} ${person.number}`);
      });
      mongoose.connection.close();
    }
  } catch (error) {
    console.error("Error in application logic:", error.message);
  }
}

run();
