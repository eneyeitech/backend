const express = require('express');

const app = express();


app.use(express.json());

let persons = [
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]

app.get('/', (request, response)=>{
    response.end('<h1>Persons API</h1>')
})

app.get('/api/persons', (request, response)=>{
    response.json(persons);
})

app.get('/api/persons/:id', (request, response)=> {
    const id = request.params.id;

    const person = persons.find(p=>p.id === id)

    if(person){
        response.json(person);
    }else{
        response.status(404).end();
    }
})

app.delete('/api/persons/:id', (request, response)=>{
    const id = request.params.id;

    persons = persons.filter(p=>p.id !== id);

    response.status(204).end()
})

app.get('/info', (request, response)=>{
    let message = `<p>Phonebook has info for ${persons.length} people</p>`
    message += `<p>${new Date()}</p>`

    response.send(message);
})


const PORT = 3001
app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
})