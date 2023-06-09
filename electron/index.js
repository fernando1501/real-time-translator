const express = require('express');
const electron = require('electron');
const fs = require('fs').promises;
const fsNormal = require('fs');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const socket = require("socket.io")

const app = express();
const buildPath = path.join(__dirname, '../build');
const http = require('http');
const server = http.createServer(app);

const userDataPath = electron.app.getPath('userData');

const configPath = path.resolve(userDataPath, 'rtt-config.json')

if (!fsNormal.existsSync(configPath)) {
  fsNormal.writeFileSync(configPath, JSON.stringify({
    "src_lang": "es",
    "target_lang": "en"
  }));
}

const io = new socket.Server(server, { cors: { origin: '*' } });

app.use(cors());

app.use(express.json())

app.use(express.static(buildPath));

app.get('/config', async (req, res) => {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    res.json(config);
  } catch (err) {
    console.error('Error al leer el archivo config.json:', err);
    res.status(500).send('Error al leer el archivo config.json');
  }
});

// Endpoint POST para modificar un parámetro del archivo config.json
app.post('/config', async (req, res) => {
  const { name, value } = req.body;
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    config[name] = value;
    const updatedConfig = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, updatedConfig, 'utf8');
    res.send('Configuración actualizada con éxito');
  } catch (err) {
    console.error('Error al actualizar el archivo config.json:', err);
    res.status(500).send('Error al actualizar el archivo config.json');
  }
});

app.post('/translate', async (req, res) => {
  try {
    const { text } = req.body;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&hl=en&ie=UTF-8&oe=UTF-8&otf=1&q=${encodeURIComponent(text)}&sl=es&ssel=0&tk=xxxx&tl=en&tsel=0&dj=1`;

    const response = await axios.get(url);
    const translatedText = response.data;

    const translatedJoinedSentences = translatedText?.sentences ? translatedText?.sentences
      ?.filter((s) => 'trans' in s)
      ?.map(s => s.trans)
      ?.join('') : '';

    io.emit('change-text', { text: translatedJoinedSentences })

    res.json({
      text: translatedJoinedSentences
    });
  } catch (error) {
    console.error('Error al realizar la solicitud de traducción:', error);
    res.status(500).send('Error al realizar la solicitud de traducción');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

const port = 4000;

server.listen(port, () => {
  console.log(`Servidor iniciado en el puerto ${port}`);
});

module.exports = {
  port
}