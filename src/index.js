const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const {username} = request.headers;

  const findUser = users.find(user => user.username === username);

  if(findUser) {
    request.user = findUser;
    next();
  }else {
    return response.status(404);
  }
}

function checksCreateTodosUserAvailability(request, response, next) {
  const {user}  = request;
  //pro: false

  const userTodoList = user.todos;

  //se nao estiver com plano pro e com menos de 10 todos, CHAME NEXT()
  //se estiver com plano pro CHAME NEXT()

  if(userTodoList.length >= 9 && user.pro === false){
    //NAO E PERMITIDO QUE O USUARIO CRIE MAIS TASKS
    return response.status(403)
  }else {
    next();
  }

}

function checksTodoExists(request, response, next) {
  const username = request.headers.username;

  //VERIFICAR SE ESSE ID PERTENCE A ALGUM TODO DO USER INFORMADO
  const {id} = request.params;

  const validateUser = users.find(user => user.username === username);
  if(!validateUser){
    return response.status(404).json({error: "e silada bino"})
  }

  //validation result
  const validateID = validate(id);
  if(!validateID){
    return response.status(400).json({error: "e silada bino 22"})
  }
  
  // validar que esse id pertence a um todo do usuário informado.
  let taskValidation = validateUser.todos.find(task => task.id === id);
  if(!taskValidation) {
    return response.status(404).json({error: "e silada bino"})
  }


  request.user = validateUser;
  request.todo = taskValidation;
  return next();
}

function findUserById(request, response, next) {
  const {id} =  request.params;

  let findUserById = users.find(user => user.id === id);

  if(findUserById){
    request.user = findUserById;
    next();
  }else {
    return response.status(404);
  };
};

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: 'Username already exists' });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: []
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch('/users/:id/pro', findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response.status(400).json({ error: 'Pro plan is already activated.' });
  }

  user.pro = true;

  return response.json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { user, todo } = request;

  const todoIndex = user.todos.indexOf(todo);

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};