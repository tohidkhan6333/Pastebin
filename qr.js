const express = require('express');
const router = express.Router();
const { exec } = require("child_process");
const pino = require("pino");
const { toBuffer } = require("qrcode");
const path = require('path');
const fs = require("fs-extra");
const { Boom } = require("@hapi/boom");

const MESSAGE = process.env.MESSAGE || `
🌐 *ʜᴇʏ ᴛʜᴇʀᴇ, ᴀʟɪ-ᴍᴅ ʙᴏᴛ ᴜsᴇʀ! 👋🏻*

✨ *ʏᴏᴜʀ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ / sᴇssɪᴏɴ ɪᴅ ɪs ɢᴇɴᴇʀᴀᴛᴇᴅ!* 🔐

⚠️ *ᴅᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ — ɪᴛ ɪs ᴘʀɪᴠᴀᴛᴇ!*

🪀 *ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ:*  
👉🏻 https://whatsapp.com/channel/0029VaoRxGmJpe8lgCqT1T2h

🖇️ *ɢɪᴛʜᴜʙ ʀᴇᴘᴏ:*  
👉🏻 https://github.com/ALI-INXIDE/ALI-MD

> *ᴍᴀᴅᴇ ᴡɪᴛʜ ʟᴏᴠᴇ ʙʏ ᴀʟɪ ɪɴxɪᴅᴇ 🫶🏻*
`;

if (fs.existsSync('./auth_info_baileys')) {
  fs.emptyDirSync(path.join(__dirname, 'auth_info_baileys'));
}

router.get('/', async (req, res) => {
  async function SUHAIL() {
    try {
      // Dynamic import of baileys - यहाँ fix है
      const baileys = await import("@whiskeysockets/baileys");
      
      // Destructure from default export
      const {
        useMultiFileAuthState,
        makeWASocket,
        Browsers,
        delay,
        DisconnectReason,
        makeInMemoryStore
      } = baileys.default || baileys;
      
      const uploadToPastebin = require('./Paste');
      
      const store = makeInMemoryStore({ 
        logger: pino().child({ level: 'silent', stream: 'store' }) 
      });

      const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_baileys'));

      let Smd = makeWASocket({
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        auth: state
      });

      Smd.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect, qr } = s;

        // ---------------- QR CODE HTML -----------------
        if (qr) {
          if (!res.headersSent) {
            try {
              const qrBuffer = await toBuffer(qr);
              const qrBase64 = qrBuffer.toString('base64');

              const html = `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ALI-MD | QR SCAN</title>
                <style>
                  body { display: flex; justify-content: center; align-items: center; height: 100vh; background: #1e1e1e; color: #fff; font-family: sans-serif; }
                  .container { text-align: center; }
                  img { width: 300px; height: 300px; margin-bottom: 20px; }
                  h1 { margin-bottom: 10px; font-size: 24px; }
                  p { font-size: 16px; }
                  .link { color: #4fc3f7; text-decoration: none; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Scan this QR with WhatsApp</h1>
                  <img src="data:image/png;base64,${qrBase64}" alt="QR Code"/>
                  <p>Session will be generated after scanning.</p>
                  <p><a href="https://github.com/ALI-INXIDE/ALI-MD" target="_blank" class="link">Give a Star on Repo 🌟</a></p>
                </div>
              </body>
              </html>
              `;
              res.setHeader('Content-Type', 'text/html');
              res.send(html);
              return;
            } catch (error) {
              console.error("Error generating QR Code buffer:", error);
              res.status(500).send("Error generating QR Code");
              return;
            }
          }
        }

        // ---------------- SESSION OPEN -----------------
        if (connection === "open") {
          await delay(3000);
          const user = Smd.user.id;

          const credsFilePath = path.join(__dirname, 'auth_info_baileys', 'creds.json');
          const pastebinUrl = await uploadToPastebin(credsFilePath, 'creds.json', 'json', '1');
          const Scan_Id = pastebinUrl;

          console.log(`
====================  SESSION ID  ==========================
SESSION-ID ==> ${Scan_Id}
-------------------   SESSION CLOSED   -----------------------
`);

          const msgsss = await Smd.sendMessage(user, { text: Scan_Id });
          await Smd.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });

          try {
            fs.emptyDirSync(path.join(__dirname, 'auth_info_baileys'));
          } catch (e) {
            console.error('Error clearing directory:', e);
          }
        }

        Smd.ev.on('creds.update', saveCreds);

        // ---------------- CONNECTION CLOSE -----------------
        if (connection === "close") {
          let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
          if (reason === DisconnectReason.connectionClosed) {
            console.log("Connection closed!");
          } else if (reason === DisconnectReason.connectionLost) {
            console.log("Connection Lost from Server!");
          } else if (reason === DisconnectReason.restartRequired) {
            console.log("Restart required, Restarting...");
            SUHAIL().catch(err => console.log(err));
          } else if (reason === DisconnectReason.timedOut) {
            console.log("Connection TimedOut!");
          } else {
            console.log('Connection closed with bot. Please run again.');
            console.log(reason);
            await delay(5000);
            exec('pm2 restart qasim');
            process.exit(0);
          }
        }
      });

    } catch (err) {
      console.log(err);
      exec('pm2 restart qasim');
      fs.emptyDirSync(path.join(__dirname, 'auth_info_baileys'));
    }
  }

  SUHAIL().catch(async (err) => {
    console.log(err);
    fs.emptyDirSync(path.join(__dirname, 'auth_info_baileys'));
    exec('pm2 restart qasim');
  });
});

module.exports = router;