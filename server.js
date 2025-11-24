// server.js (versão simples, sem JWT)
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// MIDDLEWARES BÁSICOS
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Servir pasta public
app.use(express.static(path.join(__dirname, "public")));

// =========================
// BANCO DE DADOS SQLITE
// =========================
const db = new sqlite3.Database("database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);
});

// =========================
// ROTAS DE AUTENTICAÇÃO
// =========================

// Cadastro
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'user', 'pending')
    `);

    stmt.run([name, email, hash], function (err) {
      if (err) {
        console.error("Erro ao cadastrar:", err.message);
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ error: "Email já cadastrado." });
        }
        return res.status(500).json({ error: "Erro interno ao cadastrar." });
      }

      return res.json({
        message: "Cadastro realizado. Aguarde aprovação do administrador."
      });
    });
  } catch (e) {
    console.error("Erro no hash da senha:", e);
    return res.status(500).json({ error: "Erro interno ao cadastrar." });
  }
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (err) {
        console.error("Erro ao buscar usuário:", err);
        return res.status(500).json({ error: "Erro interno." });
      }

      if (!user) {
        return res.status(401).json({ error: "Usuário ou senha inválidos." });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: "Usuário ou senha inválidos." });
      }

      if (user.status !== "approved") {
        return res.status(403).json({ error: "Usuário ainda não aprovado pelo admin." });
      }

      // aqui não tem JWT, só retorna OK
      return res.json({
        message: "Login bem-sucedido",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    }
  );
});

// =========================
// ROTAS ADMIN (SEM TOKEN)
// =========================

// Listar usuários pendentes
app.get("/admin/users", (req, res) => {
  db.all(
    "SELECT id, name, email, role, status FROM users WHERE status = 'pending' ORDER BY id ASC",
    [],
    (err, rows) => {
      if (err) {
        console.error("Erro ao listar usuários:", err);
        return res.status(500).json({ error: "Erro interno." });
      }
      res.json(rows);
    }
  );
});

// Aprovar usuário
app.post("/admin/approve/:id", (req, res) => {
  const id = req.params.id;

  db.run(
    "UPDATE users SET status = 'approved' WHERE id = ?",
    [id],
    function (err) {
      if (err) {
        console.error("Erro ao aprovar usuário:", err);
        return res.status(500).json({ error: "Erro interno." });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      res.json({ ok: true, message: "Usuário aprovado com sucesso." });
    }
  );
});

// =========================
// ROTAS DE PÁGINA (HTML)
// =========================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/painel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "painel.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// =========================
// INICIAR SERVIDOR
// =========================
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
