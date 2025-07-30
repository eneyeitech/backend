// index.js
require('dotenv').config() // Load environment variables from .env file
const express = require("express");
const morgan = require("morgan");
const cors = require('cors');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const app = express();

// --- MongoDB Connection Setup ---
console.log('connecting to', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.error('error connecting to MongoDB:', error.message);
  });

// --- Mongoose Schema and Model ---
const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    required: true,
    unique: true
  },
  number: {
    type: String,
    minlength: 8, // Already handles length of 8 or more
    required: true,
    // Custom validator for phone number format
    validate: {
      validator: function(v) {
        // Regex explanation:
        // ^                 - start of the string
        // (\d{2}|\d{3})     - first part: exactly 2 OR exactly 3 digits
        // -                 - a literal hyphen separator
        // \d+               - second part: one or more digits
        // $                 - end of the string
        return /^(\d{2}|\d{3})-\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number! It must be formed of two parts separated by '-', the first part having 2 or 3 numbers and the second part consisting of numbers only. (e.g., 09-1234556 or 040-22334455)`
    }
  },
});

// Apply the uniqueValidator plugin to personSchema.
personSchema.plugin(uniqueValidator);

// Transform the output of toJSON for better formatting (remove _id, __v)
personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

const Person = mongoose.model("Person", personSchema);

// --- Express Middleware ---
app.use(express.static('dist')); // Serve frontend build

app.use(cors()); // Enable CORS for all origins

app.use(express.json()); // Parse JSON request bodies

// Custom Morgan token for POST data
morgan.token("postData", (req) => {
  return req.method === "POST" ? JSON.stringify(req.body) : "";
});

// Morgan logging middleware (using only one instance)
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postData'));

// --- API Endpoints ---

app.get("/", (request, response) => {
  response.send("<h1>Persons API</h1>"); // Use send instead of end for HTML content
});

// Get all persons
app.get("/api/persons", (request, response, next) => {
  Person.find({})
    .then(persons => {
      response.json(persons);
    })
    .catch(error => next(error)); // Pass errors to error handling middleware
});

// Get a single person by ID
app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).end(); // Person not found
      }
    })
    .catch(error => next(error)); // Pass errors (e.g., CastError for invalid ID)
});

// Delete a person by ID
app.delete("/api/persons/:id", (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      if (result) {
        response.status(204).end(); // Successfully deleted (No Content)
      } else {
        response.status(404).end(); // Person not found for deletion
      }
    })
    .catch(error => next(error)); // Pass errors
});

// Add a new person
/*app.post("/api/persons", (request, response, next) => {
  const body = request.body;

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person.save()
    .then(savedPerson => {
      response.status(201).json(savedPerson); // 201 Created
    })
    .catch(error => next(error)); // Pass Mongoose validation errors
});*/
// Add a new person or update existing if name exists
app.post("/api/persons", (request, response, next) => {
  const { name, number } = request.body;

  // Basic validation for missing fields
  if (!name || !number) {
    return response.status(400).json({ error: "name or number missing" });
  }

  // 1. Check if a person with this name already exists
  Person.findOne({ name: name })
    .then(existingPerson => {
      if (existingPerson) {
        // 2. If person exists, update their number (and potentially other fields)
        // We'll update the 'number' field of the found document
        existingPerson.number = number;

        // Use .save() on the document to trigger schema validation and save changes
        return existingPerson.save()
          .then(updatedPerson => {
            response.json(updatedPerson); // Respond with the updated person
          })
          .catch(error => next(error)); // Pass Mongoose validation errors during update
      } else {
        // 3. If person does not exist, create a new one
        const newPerson = new Person({
          name,
          number,
        });

        return newPerson.save()
          .then(savedPerson => {
            response.status(201).json(savedPerson); // 201 Created for new resource
          })
          .catch(error => next(error)); // Pass Mongoose validation errors during creation
      }
    })
    .catch(error => next(error)); // Catch any potential errors from findOne
});

// Update a person's number (example: assuming name is unique and we're updating number)
// A more robust update would allow updating either field, or both.
app.put("/api/persons/:id", (request, response, next) => {
  const { name, number } = request.body; // Destructure name and number from body

  // We pass { new: true } to get the updated document back
  // and { runValidators: true } to apply schema validations on update
  Person.findByIdAndUpdate(
    request.params.id,
    { name, number }, // Only update fields that are present
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      if (updatedPerson) {
        response.json(updatedPerson);
      } else {
        response.status(404).end(); // Person not found
      }
    })
    .catch(error => next(error));
});


// Get info about the phonebook
app.get("/info", (request, response, next) => {
  Person.countDocuments({})
    .then(count => {
      let message = `<p>Phonebook has info for ${count} people</p>`;
      message += `<p>${new Date()}</p>`;
      response.send(message);
    })
    .catch(error => next(error));
});


// --- Error Handling Middleware ---
const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === 'CastError') {
    // Invalid MongoDB ID format
    return response.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    // Mongoose validation error (e.g., required field missing, minlength, unique)
    return response.status(400).json({ error: error.message });
  }

  next(error); // Pass to default Express error handler
};

// This has to be the last loaded middleware
app.use(errorHandler);


// --- Server Start ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});