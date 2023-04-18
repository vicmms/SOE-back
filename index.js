const express = require('express')
const app = express()
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mysql = require('mysql')
const port = 3000
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass',
    database: 'test_soe',

})

const allowedList = ['http://localhost:3000', 'http://localhost:8080']

app.use(cors({
    origin: allowedList
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

db.connect((error) => {
    if (error)
        throw error;
    console.log('conected...')
})

app.get('/users', (req, res) => {
    db.query('SELECT u.id,u.name,u.lastname,l.level FROM users u LEFT JOIN levels l on u.id_level = l.id', (error, result) => {
        if (error)
            res.status(500).send({ error: 'Server error' })
        else
            res.status(200).send(result)
    })
})

app.get('/levels', (req, res) => {
    db.query('SELECT * FROM levels', (error, result) => {
        if (error)
            res.status(500).send({ error: 'Server error' })
        else
            res.status(200).send(result)
    })
})

app.post('/users', (req, res) => {
    const { name, lastname, user, password } = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }

        const newUser = {
            name,
            lastname,
            user,
            password: hash,
        };

        db.query('INSERT INTO users SET ?', newUser, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error interno del servidor al crear el usuario' });
            }

            res.status(201).json({ message: 'Usuario creado exitosamente' });
        });
    });
});

app.post('/login', (req, res) => {
    const { user, password } = req.body;

    db.query('SELECT * FROM users WHERE user = ?', [user], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(401).json({ message: 'Error de autenticación' });
            }

            if (!result) {
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }

            const token = jwt.sign({ sub: user.id }, 'secretkey', { expiresIn: '1h' });

            res.status(200).json({ token });
        });
    });
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})