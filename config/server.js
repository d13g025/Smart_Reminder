const express = require('express');
const path = require('path')
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// Configurando a view engine EJS
app.set('view engine', 'ejs');

//Configurando o diretorio de arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Configurando o body-parser para JSON
app.use(bodyParser.json());

// Configurando o body-parser para URL-encoded
app.use(bodyParser.urlencoded({ extended: true }));

// Configurando o express-session
app.use(session({
    secret: 'suaChaveSecreta', // Chave secreta para assinar o cookie da session ID (deve ser mantida em segredo)
    resave: false, // Evita que a session seja regravada no servidor a cada requisição
    saveUninitialized: false // Evita salvar sessions vazias no servidor
}));

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});


module.exports = app;
