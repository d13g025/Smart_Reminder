const mysql = require('mysql')

//criando a instancia de conexao com o BD
const connection = mysql.createConnection({
    host: 'localhost',
	user: 'root',
	password: '',
	database: 'smartreminder'
})

//inicia a conexao, se der erro mostra
connection.connect((err) => {
    if (err) {
        console.log("Erro ao conectar: " + err.stack);
        return;
    }
    console.log('Conectado ao banco de dados MySQL com o ID ' + connection.threadId);
});

module.exports = connection;