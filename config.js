const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "GENIE-MD~&XU1nhJ6a#_RrGzcmOzMbk5yEihC4YyOC65As_7ZMIh5buCh-_I8E",
OWNER_NUMBER: process.env.OWNER_NUMBER || "94752269410",
AUTO_RECORDING: process.env.AUTO_RECORDING || "true",
ALIVE_IMG: process.env.ALIVE_IMG || "https://i.postimg.cc/900HyS1X/20250608-175819.jpg",
ALIVE_MSG: process.env.ALIVE_MSG || "_`WELCOME TO GENIE-MD 🧞‍♂️`_\n\n╭ᴮᴼᵀ ᴰᴱᵀᴬᴵᴸˢ╯\n▏ `𝘕𝘈𝘔𝘌` : ᴳᴱᴺᴵᴱ-ᴹᴰ\n▏ `𝘜𝘚𝘌𝘙` : ${pushname}\n▏ `𝘖𝘞𝘕𝘌𝘙 𝘕𝘈𝘔𝘌` : ᴋᴜꜱʜᴀɴ ᴀ ᴡɪᴄᴋʀᴀᴍᴀꜱɪɴɢʜᴇ\n▏ `𝘊𝘖𝘕𝘛𝘈𝘊𝘛 𝘖𝘞𝘕𝘌𝘙` : 94785153782\n▏ `𝘗𝘙𝘌𝘍𝘐𝘟` : .\n▏\n▏ `𝘠𝘖𝘜𝘛𝘜𝘉𝘌 𝘊𝘏𝘈𝘕𝘕𝘌𝘓` : https://www.youtube.com/@SmartTweak07\n▏ `𝘔𝘖𝘝𝘐𝘌 𝘎𝘙𝘖𝘜𝘗` : https://chat.whatsapp.com/FvhNKzzYw3e6rTf02eqdMr\𝘯\n\n*Github Repo* : https://github.com/pakaya0704/Media-Genie\n> 𝗚_𝗘_𝗡_𝗜_𝗘 - 𝗠𝗗🧞‍♂️",
};
