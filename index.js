const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  sms,
  downloadMediaMessage
} = require('./lib/functions');

const fs = require('fs');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { File } = require('./lib/file'); // likely holds helper for file loading
const prefix = '.';
const ownerNumber = [config.OWNER_NUMBER]; // array with bot owner's WhatsApp ID

// Session setup: If auth folder doesn't exist and no SESSION_ID is given, exit.
const authDir = __dirname + '/auth_info_baileys/';
if (!fs.existsSync(authDir)) {
  if (!config.SESSION_ID) {
    console.error('Please add your SESSION_ID env !!');
    process.exit(1);
  }
  const sessdata = config.SESSION_ID.replace("GENIE-MD~", '');
  const filer = File.fromString(authDir + sessdata);
  filer.read((err, buffer) => {
    if (err) throw err;
    fs.writeFileSync(authDir + 'creds.json', buffer);
    console.log('Session downloaded ✅');
  });
}

// Main function to connect to WhatsApp
async function connectToWA() {
  console.log('Connecting wa bot 🧬...');
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: true,
    auth: state,
    version
  });

  // Handle connection updates
  sock.ev.on('connection.update', update => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect.error?.statusCode !== DisconnectReason.loggedOut) {
        return connectToWA();
      }
      console.log('Logged out, reconnecting...');
    } else if (connection === 'open') {
      console.log('Bot connected to WhatsApp ✅');

      // Dynamically load plugin modules from /plugins folder
      fs.readdirSync('./plugins/').forEach(file => {
        if (file.endsWith('.js')) {
          require('./plugins/' + file);
        }
      });

      console.log('Plugins installed successful ✅');
      // Notify bot owner
      sock.sendMessage(ownerNumber + '@s.whatsapp.net', {
        image: { url: 'https://i.postimg.cc/900HyS1X/20250608-175819.jpg' },
        caption: 'Bot connected!'
      });
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0];
    const fromMe = msg.key?.fromMe;
    const remoteJid = msg.key?.remoteJid;

    // Auto-read messages if config says so
    if (remoteJid.endsWith('@s.whatsapp.net') && config.AUTO_STATUS_SEEN === 'true') {
      await sock.readMessages([msg.key]);
    }

    // Auto-react to status updates
    if (remoteJid === 'status@broadcast' && config.STATUS_REPLY_MESSAGE === 'true') {
      const sender = msg.key.participant;
      const statusMsg = config.AUTO_STATUS_MSG;
      await sock.sendMessage(sender, {
        text: statusMsg,
        react: { text: '🧞‍♂️', key: msg.key }
      });
    }

    const messageType = getContentType(msg.message);
    let text = '';
    if (messageType === 'conversation') text = msg.message.conversation;
    else if (messageType.includes('extendedTextMessage')) text = msg.message.extendedTextMessage.text;
    else if (messageType === 'imageMessage') text = msg.message.imageMessage.caption;
    else if (messageType === 'videoMessage') text = msg.message.videoMessage.caption;

    const isCommand = text?.trim()?.startsWith(prefix);
    const args = text?.trim()?.split(/\s+/) || [];
    const command = isCommand ? args[0].slice(prefix.length).toLowerCase() : null;

    const senderId = msg.key.fromMe ? sock.user?.id?.split(':')[0] : msg.key.participant || msg.key.remoteJid;
    const isOwner = ownerNumber.includes(senderId);

    // Fetch group metadata if from group
    let groupAdmin = [];
    let isBotAdmin = false;
    let isSenderAdmin = false;
    let groupMetadata = null;
    if (remoteJid.endsWith('@g.us')) {
      groupMetadata = await sock.groupMetadata(remoteJid);
      const participants = groupMetadata.participants;
      groupAdmin = getGroupAdmins(participants);
      const normalized = await jidNormalizedUser(sock.user.id);
      isBotAdmin = groupAdmin.includes(normalized);
      isSenderAdmin = groupAdmin.includes(senderId);
    }

    // Handle quoted media repost, reaction features, etc.
    // ...

    // Load commands from ./lib/msg (assuming it's an array of command definitions)
    const commandList = require('./lib/msg').commands || [];
    if (isCommand) {
      const cmdDef = commandList.find(c => c.pattern === command || (c.alias?.includes(command)));
      if (cmdDef) {
        // Optionally auto-react emoji before invoking
        if (cmdDef.autoReact) {
          await sock.sendMessage(remoteJid, {
            react: { text: cmdDef.autoReact, key: msg.key }
          });
        }
        try {
          await cmdDef.function({
            sock,
            msg,
            text,
            args,
            command,
            isGroup: remoteJid.endsWith('@g.us'),
            isOwner,
            isBotAdmin,
            isSenderAdmin,
            groupMetadata,
            reply: (text, quoted = msg) => sock.sendMessage(remoteJid, { text }, { quoted })
          });
        } catch (err) {
          console.error('[PLUGIN ERROR]', err);
        }
      }
    }
  });
}

// Launch Express server for health checks
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

app.get('/', (_, res) => res.send('Hey Buddy, bot started ✅'));
app.listen(port, () => console.log('Server listening on port http://localhost:' + port));

setTimeout(connectToWA, 1000);
