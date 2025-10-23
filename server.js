// server.js
const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.set('trust proxy', true);
app.use(express.static('public'));

const PORT = 3000;

// Configuración de conexión
const dbConfig = {
  user: 'tdea',
  password: 'NuevaClave123*',
  server: 'ANDRES',
  database: 'BD_tdea_virtual',
  options: { trustServerCertificate: true }
};

// Función para obtener la IP real del cliente
function getClientIp(req) {
  const xfwd = req.headers['x-forwarded-for'];
  const xreal = req.headers['x-real-ip'];
  const cf = req.headers['cf-connecting-ip'];
  let ip = xfwd?.split(',')[0]?.trim() || xreal || cf || req.socket?.remoteAddress || req.ip || 'IP_no_disponible';
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}

// Ruta de login (insertar registro sin tocar la columna IDENTITY, y guardando IP)
app.post('/login', async (req, res) => {
  const { username, password } = req.body; // en tu frontend envías { username, password }
  const ip = getClientIp(req);

  try {
    // Conectar y obtener pool
    const pool = await sql.connect(dbConfig);

    // Inserción parametrizada: no tocamos id_Usuarios ni fecha_interno
    await pool.request()
      .input('nombre_usuario', sql.VarChar(200), username)
      .input('contrasena', sql.VarChar(200), password)
      .input('IP', sql.VarChar(50), ip)
      .query(`INSERT INTO Usuarios (nombre_usuario, contrasena, IP)
              VALUES (@nombre_usuario, @contrasena, @IP)`);

    res.status(500).json({ message: 'Error registrado' });
  } catch (err) {
    console.error('Error al registrar acceso:', err);
    res.status(500).json({ message: 'Error al registrar acceso', error: err.message });
  }
});



// Obtener IP local automáticamente
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Iniciar servidor visible en toda la red
app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`Servidor disponible en tu red local: http://${ip}:${PORT}`);
});

