const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const isMatch = require('date-fns/isMatch')
const format = require('date-fns/format')
var isValid = require('date-fns/isValid')
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDbAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at localhost:3000')
    })
  } catch (e) {
    console.log('DB Error ${e.message}')
    process.exit(1)
  }
}

initializeDbAndStartServer()

//api 1

const havePriority = requestQuery => {
  if (requestQuery.priority !== undefined) {
    return true
  }
}

const haveStatus = requestQuery => {
  if (requestQuery.status !== undefined) {
    return true
  }
}

const haveCategory = requestQuery => {
  if (requestQuery.category !== undefined) {
    return true
  }
}

const haveSearchQ = requestQuery => {
  if (requestQuery.search_q !== '') {
    return true
  }
}

const havePriorityAndStatus = requestQuery => {
  if (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined
  ) {
    return true
  }
}

const haveCategoryAndStatus = requestQuery => {
  if (
    requestQuery.category !== undefined &&
    requestQuery.status !== undefined
  ) {
    return true
  }
}

const haveCategoryAndPriority = requestQuery => {
  if (
    requestQuery.category !== undefined &&
    requestQuery.priority !== undefined
  )
    return true
}

const responseData = data => {
  return {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  const {status, priority, search_q = '', category} = request.query
  let getTodoQ = ''
  let data = ''

  switch (true) {
    //scenario1
    case haveStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodoQ = `SELECT * FROM todo WHERE status='${status}'`
        data = await db.all(getTodoQ)
        response.send(data.map(eachItem => responseData(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }

      break

    //scenario2
    case havePriority(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodoQ = `SELECT * FROM todo WHERE priority='${priority}'`
        data = await db.all(getTodoQ)
        response.send(data.map(eachItem => responseData(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    //scenario3
    case havePriorityAndStatus(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQ = `SELECT * FROM todo WHERE  status='${status}' AND priority='${priority}'`
          data = await db.all(getTodoQ)
          response.send(data.map(eachItem => responseData(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break

    //scenario 4
    case haveSearchQ(request.query):
      getTodoQ = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`
      data = await db.all(getTodoQ)
      response.send(data.map(eachItem => responseData(eachItem)))
      break

    //scenario 5
    case haveCategoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodoQ = `SELECT * FROM todo WHERE  status='${status}' AND category='${category}'`
          data = await db.all(getTodoQ)
          response.send(data.map(eachItem => responseData(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    //scenario 6 wrong ans
    case haveCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodoQ = `SELECT * FROM todo WHERE category='${category}';`
        data = await db.all(getTodoQ)
        response.send(data.map(eachItem => responseData(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    //scenario 7
    case haveCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodoQ = `SELECT * FROM todo WHERE priority='${priority}' AND category='${category}'`
          data = await db.all(getTodoQ)
          response.send(data.map(eachItem => responseData(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
  }
})

//api 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoq = `SELECT * FROM todo WHERE id=${todoId}`
  const data = await db.get(getTodoq)
  response.send(responseData(data))
})

//api 3 wrong ans

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  //console.log(date)
  const isDateMatched = isMatch(date, 'yyyy-MM-dd')
  //console.log(isDateMatched)
  if (isDateMatched) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    //console.log(newDate)
    const getTodoWithSpecificDate = `SELECT * FROM todo WHERE due_date='${newDate}'`
    const todoDueDate = await db.all(getTodoWithSpecificDate)
    response.send(todoDueDate.map(eachItem => responseData(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//api 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
    if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postTodoQ = `INSERT INTO todo(id,todo,priority,status,category,due_date)
        VALUES(${id},'${todo}','${priority}','${status}','${category}',${dueDate})`
          await db.run(postTodoQ)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
})

//api 5

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  console.log(requestBody)
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body

  let updateTodoQuery
  switch (true) {
    // update status
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send(`Status Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    //update priority
    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send(`Priority Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    //update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

      await db.run(updateTodoQuery)
      response.send(`Todo Updated`)
      break

    //update category
    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send(`Category Updated`)
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    //update due date wrong ans
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${newDueDate}' WHERE id = ${todoId};`

        await db.run(updateTodoQuery)
        response.send(`Due Date Updated`)
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

//api 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const delQ = `DELETE FROM todo WHERE id=${todoId}`
  await db.run(delQ)
  response.send('Todo Deleted')
})

module.exports = app
