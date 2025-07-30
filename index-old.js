const express = require("express");
const morgan = require("morgan");
const cors = require('cors')

const app = express();

app.use(express.static('dist'))

app.use(cors())

app.use(express.json());

morgan.token("postData", (req) => {
  return req.method === "POST" ? JSON.stringify(req.body) : ""; // Only log POST data
});

let persons = [
  {
    id: "1",
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: "2",
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: "3",
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: "4",
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
  {
    id: "9",
    name: "eneye",
    number: "99999999",
  },
];

app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms :postData')
  );

  app.use(morgan('tiny'));

app.get("/", (request, response) => {
  response.end("<h1>Persons API</h1>");
});

app.get("/api/persons", (request, response) => {
  response.json(persons);
});

app.get("/api/persons/:id", (request, response) => {
  const id = request.params.id;

  const person = persons.find((p) => p.id === id);

  if (person) {
    response.json(person);
  } else {
    response.status(404).end();
  }
});

app.delete("/api/persons/:id", (request, response) => {
  const id = request.params.id;

  persons = persons.filter((p) => p.id !== id);

  response.status(204).end();
});
const generateId = () => {
  return Math.floor(Math.random() * 1000000);
};
app.post("/api/persons", (request, response) => {
  const body = request.body;

  if (!body.number || !body.name) {
    return response.status(400).json({ error: "missing values (name|number)" });
  }

  const personFound = persons.find((p) => {
    console.log("p", p.name);
    console.log("b", body.name);
    return p.name === body.name;
  });
  console.log("pf", personFound);
  if (personFound) {
    return response.status(400).json({ error: "name must be unique" });
  }

  const id = generateId();
  console.log("id", id);
  const newPerson = {
    id: id,
    name: body.name,
    number: body.number,
  };
  persons.concat(newPerson);

  response.json(newPerson);
});

app.get("/info", (request, response) => {
  let message = `<p>Phonebook has info for ${persons.length} people</p>`;
  message += `<p>${new Date()}</p>`;

  response.send(message);
});

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
