const express = require('express');
const app = require('../config/server');
const session = require('express-session');
const connection = require('../config/database');

const port = 3001;

// Configuração do express-session
app.use(session({
    secret: 'suaChaveSecreta', // Deve ser mantida em segredo para assinar o cookie da session ID
    resave: false,
    saveUninitialized: false
}));

// Middleware para registrar todas as requisições
app.use((req, res, next) => {
    console.log(`${req.method} - ${req.url}`);
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

// Rota principal
app.get('/', (req, res) => {
    res.status(200).render('login'); // Renderiza a página de login
});

//rota Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Consulta SQL para verificar se o usuário e senha existem no banco de dados
    const query = `SELECT * FROM usuario WHERE email = ? AND senha = ?`;
    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error("Erro ao executar a consulta:", err);
            res.send(`
                <script>
                    alert('Erro ao tentar fazer login. Tente novamente mais tarde.');
                    window.location.href = '/';
                </script>
            `);
            return;
        }

        if (results.length > 0) {
            // Armazena o ID do usuário na sessão
            req.session.userId = results[0].id_user;
            const userId = results[0].id_user;
            // Redireciona para /home/:id após o login
            return res.redirect(`/home/${userId}`);
        } else {
            // Usuário não encontrado, exibe um alerta na página de login
            res.send(`
                <script>
                    alert('Usuário ou senha incorretos');
                    window.location.href = '/';
                </script>
            `);
        }
    });
});

//Rota GET home com id
app.get('/home/:id', (req, res) => {
    const userId = req.params.id;

    // salvando o id da sessao
    req.session.userId = userId;

    // Consulta SQL para obter o nome do usuário
    const queryUser = `SELECT nome FROM usuario WHERE id_user = ?`;
    connection.query(queryUser, [userId], (err, userResults) => {
        if (err) {
            console.error("Erro ao obter nome do usuário:", err);
            return res.status(500).send('Erro ao carregar a página');
        }

        if (userResults.length > 0) {
            const nomeUsuario = userResults[0].nome;

            // Consulta SQL para obter os documentos do usuário
            const queryDocs = `SELECT * FROM documento WHERE id_user = ?`;
            connection.query(queryDocs, [userId], (err, docResults) => {
                if (err) {
                    console.error("Erro ao obter documentos do usuário:", err);
                    return res.status(500).send('Erro ao carregar a página');
                }

                // Renderiza a página home passando o nome do usuário e os documentos como variáveis
                res.status(200).render('home', { nomeUsuario, userId, documentos: docResults });
            });
        } else {
            res.status(404).send('Usuário não encontrado');
        }
    });
});

// Rota GET para renderizar a página de cadastro de usuário
app.get('/cadastrar_usuario', (req, res) => {
    res.render('cadastrar_usuario'); // Renderiza a página de cadastro de usuário
});

//Rota POST para cadastrar usuário
app.post('/cadastrar_usuario', (req, res) => {
    const { email, senha, nome, telefone } = req.body;
    const sql = `INSERT INTO usuario (email, senha, nome, telefone) VALUES (?, ?, ?, ?)`;
    const values = [email, senha, nome, telefone];

    try {
        connection.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao cadastrar usuário:', err);
                return res.status(500).send('Erro ao cadastrar usuário');
            }

            res.send(`
                <script>
                    alert('Usuário cadastrado com sucesso');
                    window.location.href = '/';
                </script>
            `);
        });
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        res.status(500).send('Erro ao cadastrar usuário');
    }
});

app.post('/cadastrar_documento', (req, res) => {
    const { userId, descricao, dataValidade} = req.body;

    // Aqui você realiza a lógica para cadastrar o documento no banco de dados
    // Use a variável userId para associar o documento ao usuário correto

    // Exemplo de consulta SQL para inserir o documento
    const sql = `INSERT INTO documento (id_user, descricaoDoc, data_vencimento) VALUES (?, ?, ?)`;
    const values = [userId, descricao, dataValidade];

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error("Erro ao cadastrar documento:", err);
            return res.status(500).send('Erro ao cadastrar documento');
        }

        console.log("Documento cadastrado com sucesso");
        res.redirect(`/home/${userId}`); // Redireciona para a página home do usuário após o cadastro
    });
});

// Definição da rota de logout primeiro
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao encerrar sessão:', err);
            return res.status(500).send('Erro ao encerrar sessão');
        }
        res.redirect('/');
    });
});

// Rota para deletar documento
app.delete('/deletar_documento/:idDocumento', (req, res) => {
    const idDocumento = req.params.idDocumento;
    const userId = req.query.userId; // Captura o userId da query da URL

    // Consulta SQL para deletar o documento do banco de dados
    const query = `DELETE FROM documento WHERE id_doc = ?`;

    connection.query(query, [idDocumento], (err, results) => {
        if (err) {
            console.error("Erro ao deletar documento:", err);
            return res.status(500).send('Erro ao deletar documento');
        }

        // Documento deletado com sucesso
        console.log(`Documento com ID ${idDocumento} deletado com sucesso`);
        res.sendStatus(200); // Envie um status 200 OK para indicar sucesso
    });
});

// Rota para renderizar a página de atualização de documento com os dados do documento
app.get('/update_documento/:id_doc', (req, res) => {
    const documentoId = req.params.id_doc; // Captura o ID do documento da rota

    // Consulta ao banco de dados para obter os dados do documento
    const sql = 'SELECT id_doc, descricaoDoc, data_vencimento, id_user FROM documento WHERE id_doc = ?';
    connection.query(sql, [documentoId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar dados do documento:', err);
            res.status(500).send('Erro ao buscar dados do documento.');
            return;
        }

        if (results.length > 0) {
            const documento = results[0]; // Assume-se que o resultado é único (ou o primeiro, se houver vários)
            const userId = documento.id_user; // Obtém o ID do usuário do documento

            // Renderize a página update_documento e passe os dados do documento e o ID do usuário
            res.render('update_documento', { documento, userId });
        } else {
            res.status(404).send('Documento não encontrado.');
        }
    });
});

app.post('/update_documento/:id_doc', (req, res) => {
    const documentoId = req.params.id_doc; // Captura o ID do documento da rota
    const { editDescricao, editDataVencimento } = req.body; // Captura os novos dados do documento do corpo da requisição
    const userId = req.body.userId; // Captura o ID do usuário do corpo da requisição

    // Atualiza os dados do documento no banco de dados
    const sql = 'UPDATE documento SET descricaoDoc = ?, data_vencimento = ? WHERE id_doc = ?';
    connection.query(sql, [editDescricao, editDataVencimento, documentoId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar documento:', err);
            res.status(500).send('Erro ao atualizar documento.');
            return;
        }

        console.log('Documento atualizado com sucesso:', result);
        res.redirect(`/home/${userId}`); // Redireciona para a página home do usuário após a atualização
    });
});


module.exports = app;
