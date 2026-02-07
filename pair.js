const express = require('express');
const fs = require('fs-extra');
const { exec } = require("child_process");
const router = express.Router();
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const path = require('path');

const MESSAGE = process.env.MESSAGE || `👋🏻 *ʜᴇʏ ᴛʜᴇʀᴇ, ᴀʟɪ-ᴍᴅ ʙᴏᴛ ᴜsᴇʀ!*

✨ *ʏᴏᴜʀ ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ / sᴇssɪᴏɴ ɪᴅ ɪs ɢᴇɴᴇʀᴀᴛᴇᴅ!* 

⚠️ *ᴅᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ ᴡɪᴛʡ ᴀɴʏᴏɴᴇ — ɪᴛ ɪs ᴘʀɪᴠᴀᴛᴇ!*

🪀 *ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟ:*  
 *https://whatsapp.com/channel/0029VaoRxGmJpe8lgCqT1T2h*

🖇️ *ɢɪᴛʜᴜʙ ʀᴇᴘᴏ:*  
 *https://github.com/ALI-INXIDE/ALI-MD*

> *ᴍᴀᴅᴇ ᴡɪᴛʜ ʟᴏᴠᴇ ʙʏ ᴀʟɪ ɪɴxɪᴅᴇ 🍉*`;

// Ensure the directory is empty when the app starts
if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync(path.join(__dirname, 'auth_info_baileys'));
}

router.get('/', async (req, res) => {
    let num = req.query.number;

    if (!num) {
        return res.status(400).json({ error: 'Phone number required' });
    }

    async function SUHAIL() {
        try {
            // Dynamic import of baileys - यहाँ fix है
            const baileys = await import("@whiskeysockets/baileys");
            
            // Destructure from default export
            const {
                useMultiFileAuthState,
                makeWASocket,
                delay,
                makeCacheableSignalKeyStore,
                Browsers,
                DisconnectReason
            } = baileys.default || baileys;
            
            const uploadToPastebin = require('./Paste');
            
            const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_baileys'));
            
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
                    return res.json({ code });
                }
            }

            Smd.ev.on('creds.update', saveCreds);
            Smd.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    try {
                        await delay(10000);
                        
                        if (fs.existsSync(path.join(__dirname, 'auth_info_baileys', 'creds.json'))) {
                            const credsFilePath = path.join(__dirname, 'auth_info_baileys', 'creds.json');
                            const pastebinUrl = await uploadToPastebin(credsFilePath, 'creds.json', 'json', '1');
                            const Scan_Id = pastebinUrl;
                            let user = Smd.user.id;

                            // Send first message: session ID
                            await Smd.sendMessage(user, { text: Scan_Id });

                            // Prepare fake vCard
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

                            // Send second message: MESSAGE + quoted fake vCard
                            await Smd.sendMessage(user, { text: MESSAGE }, { quoted: gift });
                            
                            await delay(1000);
                            try { 
                                fs.emptyDirSync(path.join(__dirname, 'auth_info_baileys')); 
                            } catch (e) {
                                console.log("Error clearing directory:", e);
                            }
                        }
                    } catch (e) {
                        console.log("Error during file upload or message send: ", e);
                    }

                    await delay(100);
                    fs.emptyDirSync(path.join(__dirname, 'auth_info_baileys'));
                }

                // Handle connection closures
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
                    }
                }
            });

        } catch (err) {
            console.log("Error in SUHAIL function: ", err);
            exec('pm2 restart qasim');
            console.log("Service restarted due to error");
            fs.emptyDirSync(path.join(__dirname, 'auth_info_baileys'));
            if (!res.headersSent) {
                res.json({ code: "Try After Few Minutes" });
            }
        }
    }

    SUHAIL();
});

module.exports = router;