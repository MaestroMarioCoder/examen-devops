const express = require("express");
const cors = require("cors");

if (process.env.NODE_ENV !== "docker") {
    require("dotenv").config();
}

const mysql = require("mysql2");
const https = require("https");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Detectar entorno
const isDocker = process.env.NODE_ENV === "docker";

// Cargar certificados opcionales
let sslOptions = null;
try {
    sslOptions = {
        key: fs.readFileSync("./certs/tareasapp.local-key.pem"),
        cert: fs.readFileSync("./certs/tareasapp.local.pem")
    };
    console.log("Certificados SSL cargados correctamente");
} catch (err) {
    console.log("Certificados NO cargados, usando HTTP.");
}

// =============================================
// CONFIGURACIÓN DE BASE DE DATOS (DEFINITIVA)
// =============================================
const dbConfig = {
    host: isDocker ? "tareas-mysql" : (process.env.DB_HOST || "localhost"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "1191",
    database: process.env.DB_NAME || "tareasdb",
    port: 3306,
    ssl: false
};

let db;

// Intento de conexión con reintentos
function conectarMySQL() {
    console.log(`🔄 Intentando conectar a MySQL en host=${dbConfig.host}`);

    db = mysql.createConnection(dbConfig);

    db.connect((err) => {
        if (err) {
            console.log("❌ MySQL no está listo, reintentando en 2s...");
            return setTimeout(conectarMySQL, 2000);
        }
        console.log("✅ Conexión a MySQL exitosa");
    });
}

conectarMySQL();

// =============================================
// RUTAS
// =============================================

app.get("/", (req, res) => {
    res.send("Backend funcionando en Docker 😎");
});

// Crear tarea
app.post("/api/tareas", (req, res) => {
    const { nombre, descripcion } = req.body;

    const sql = "INSERT INTO tareas (nombre, descripcion) VALUES (?, ?)";
    db.query(sql, [nombre, descripcion], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al insertar" });

        res.json({
            id: result.insertId,
            nombre,
            descripcion,
            estado: "pendiente"
        });
    });
});

// Obtener tareas
app.get("/api/tareas", (req, res) => {
    db.query("SELECT * FROM tareas", (err, rows) => {
        if (err) return res.status(500).json({ error: "Error al obtener" });
        res.json(rows);
    });
});

// Editar tarea
app.put("/api/tareas/:id", (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    db.query(
        "UPDATE tareas SET nombre=?, descripcion=? WHERE id=?",
        [nombre, descripcion, id],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al actualizar" });

            res.json({ message: "Tarea actualizada" });
        }
    );
});

// Cambiar estado
app.put("/api/tareas/estado/:id", (req, res) => {
    const { id } = req.params;

    db.query("SELECT estado FROM tareas WHERE id=?", [id], (err, rows) => {
        if (err || rows.length === 0)
            return res.status(500).json({ error: "Error al obtener estado" });

        const estados = ["pendiente", "completada", "cancelada"];
        const actual = rows[0].estado;
        const siguiente = estados[(estados.indexOf(actual) + 1) % estados.length];

        db.query(
            "UPDATE tareas SET estado=? WHERE id=?",
            [siguiente, id],
            (err) => {
                if (err) return res.status(500).json({ error: "Error al cambiar estado" });

                res.json({ message: "Estado actualizado", nuevo_estado: siguiente });
            }
        );
    });
});

// Eliminar tarea
app.delete("/api/tareas/:id", (req, res) => {
    db.query("DELETE FROM tareas WHERE id=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar" });

        res.json({ message: "Tarea eliminada" });
    });
});

// =============================================
// SERVIDOR
// =============================================
const PORT = process.env.PORT || 3001;

if (sslOptions) {
    https.createServer(sslOptions, app).listen(PORT, () => {
        console.log("🚀 Servidor API HTTPS en puerto " + PORT);
    });
} else {
    app.listen(PORT, () => {
        console.log("🚀 Servidor API HTTP sin SSL en puerto " + PORT);
    });
}


// ================================================
//                 FIN DEL ARCHIVO
// ================================================     

