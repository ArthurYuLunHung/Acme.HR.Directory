require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`
);

const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * from departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * from employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
      INSERT INTO employees(name, department_id)
      VALUES($1, $2)
      RETURNING *
      `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = /* sql */ `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at=now()
        WHERE id=$3
        RETURNING *
        `;
    const response = await client.query(SQL, [
      req.body.name,

      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE from employees WHERE id = $1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  res.status(res.status || 500).send({ error: error });
});

const init = async () => {
  await client.connect();

  let SQL = /* sql */ `
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  ranking INTEGER DEFAULT 3 NOT NULL,
  name VARCHAR(100) NOT NULL,
  department_id INTEGER REFERENCES departments(id) NOT NULL  
);
`;

  await client.query(SQL);
  console.log("table created");

  SQL = /* sql */ `
  INSERT INTO departments(name) VALUES('Transport');
  INSERT INTO departments(name) VALUES('Quality Control');
  INSERT INTO departments(name) VALUES('Management');

  INSERT INTO employees(name, ranking, department_id) VALUES('Arthur', 5, (SELECT id FROM departments WHERE name='Transport'));

  INSERT INTO employees(name, ranking, department_id) VALUES('Gavin', 6, (SELECT id FROM departments WHERE name='Quality Control'));

  INSERT INTO employees(name, ranking, department_id) VALUES('Wade', 4, (SELECT id FROM departments WHERE name='Management'));
  
  `;

  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT;
  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });
};

init();
