const express = import('express');
const fs = import('fs-extra');
const { exec } = import("child_process");
let router = express.Router();
const pino = import("pino");
const { Boom } = import("@hapi/boom");
const MESSAGE = process.env.MESSAGE || `👋🏻 *ʜᴇʏ ᴛʜᴇʀᴇ, ᴀʟɪ-ᴍᴅ ʙᴏᴛ ᴜsᴇʀ!*

✨ *ʏᴏᴜʀ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ / sᴇssɪᴏɴ ɪᴅ ɪs ɢᴇɴᴇʀᴀᴛᴇᴅ!* 

⚠️ *ᴅᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ — ɪᴛ ɪs ᴘʀɪᴠᴀᴛᴇ!*

🪀 *ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ:*  
 *https://whatsapp.com/channel/0029VaoRxGmJpe8lgCqT1T2h*

🖇️ *ɢɪᴛʜᴜʙ ʀᴇᴘᴏ:*  
 *https://github.com/ALI-INXIDE/ALI-MD*

> *ᴍᴀᴅᴇ ᴡɪᴛʜ ʟᴏᴠᴇ ʙʏ ᴀʟɪ ɪɴxɪᴅᴇ 🍉*`;

const uploadToPastebin = require('./Paste');  // Assuming you have a function to upload to Pastebin
const baileys = await import("@whiskeysockets/baileys");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  DisconnectReason
} = baileys;

// Ensure the directory is empty when the app starts
if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync(__dirname + '/auth_info_baileys');
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    async function SUHAIL() {
        const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_baileys`);
        try {
            let Smd = makeWASocket({
    auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
            });

            if (!Smd.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await Smd.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            Smd.ev.on('creds.update', saveCreds);
            Smd.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    try {
                        await delay(10000);
                        if (fs.existsSync('./auth_info_baileys/creds.json'));

                        const auth_path = './auth_info_baileys/';
                        let user = Smd.user.id;

                        // Upload the creds.json to Pastebin directly
                        const credsFilePath = auth_path + 'creds.json';
                        const pastebinUrl = await uploadToPastebin(credsFilePath, 'creds.json', 'json', '1');

                        const Scan_Id = pastebinUrl;

        // 2️⃣ Send first message: session ID
        let msg1 = await Smd.sendMessage(user, { text: Scan_Id });

        // 3️⃣ Prepare fake vCard
        let gift = {
            key: {
                fromMe: false,
                participant: `0@s.whatsapp.net`,
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: "ALI-MD SESSION ☁️",
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:'ALI-MD'\nitem1.TEL;waid=${user.split("@")[0]}:${user.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                }
            }
        };

        // 4️⃣ Send second message: MESSAGE + quoted fake vCard
        await Smd.sendMessage(user, { text: MESSAGE }, { quoted: gift });
                        await delay(1000);
                        try { await fs.emptyDirSync(__dirname + '/auth_info_baileys'); } catch (e) {}

                    } catch (e) {
                        console.log("Error during file upload or message send: ", e);
                    }

                    await delay(100);
                    await fs.emptyDirSync(__dirname + '/auth_info_baileys');
                }

                // Handle connection closures
                if (connection === "close") {
                    let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                    if (reason === DisconnectReason.connectionClosed) {
                        console.log("Connection closed!");
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.log("Connection Lost from Server!");
                    } else if (reason === DisconnectReason.restartimportd) {
                        console.log("Restart importd, Restarting...");
                        SUHAIL().catch(err => console.log(err));
                    } else if (reason === DisconnectReason.timedOut) {
                        console.log("Connection TimedOut!");
                    } else {
                        console.log('Connection closed with bot. Please run again.');
                        console.log(reason);
                        await delay(5000);
                        exec('pm2 restart qasim');
                    }
                }
            });

        } catch (err) {
            console.log("Error in SUHAIL function: ", err);
            exec('pm2 restart qasim');
            console.log("Service restarted due to error");
            SUHAIL();
            await fs.emptyDirSync(__dirname + '/auth_info_baileys');
            if (!res.headersSent) {
                await res.send({ code: "Try After Few Minutes" });
            }
        }
    }

   return await SUHAIL();
});

module.exports = router;
