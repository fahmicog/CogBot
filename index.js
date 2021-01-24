const { create, Client } = require('@open-wa/wa-automate')
const welcome = require('./lib/welcome')
const left = require('./lib/left')
const cron = require('node-cron')
const color = require('./lib/color')
const fs = require('fs')
// const msgHndlr = require ('./fahmi')
const figlet = require('figlet')
const lolcatjs = require('lolcatjs')
const options = require('./options')

// AUTO UPDATE BY NURUTOMO
// THX FOR NURUTOMO
// Cache handler and check for file change
require('./fahmi.js')
nocache('./fahmi.js', module => console.log(`'${module}' Updated!`))
require('./lib/help.js')
nocache('./lib/help.js', module => console.log(`'${module}' Updated!`))
require('./lib/database/setting.json')
nocache('./lib/database/setting.json', module => console.log(`'${module}' Updated!`))

const adminNumber = JSON.parse(fs.readFileSync('./lib/database/admin.json'))
const setting = JSON.parse(fs.readFileSync('./lib/database/setting.json'))
const isWhite = (chatId) => adminNumber.includes(chatId) ? true : false

let { 
    limitCount,
    memberLimit, 
    groupLimit,
    mtc: mtcState,
    banChats,
    restartState: isRestart
    } = setting

function restartAwal(fahmi){
    setting.restartState = false
    isRestart = false
    fahmi.sendText(setting.restartId, 'Restart Succesfull!')
    setting.restartId = 'undefined'
    //fs.writeFileSync('./lib/setting.json', JSON.stringify(setting, null,2));
}

lolcatjs.options.seed = Math.round(Math.random() * 1000);
lolcatjs.options.colors = true;

const start = async (fahmi = new Client()) => {
        console.log('------------------------------------------------')
        lolcatjs.fromString(color(figlet.textSync('COG BOT', { horizontalLayout: 'full' })))
        console.log('------------------------------------------------')
        lolcatjs.fromString('[DEV] FahmiH.')
        lolcatjs.fromString('[SERVER] Server Started!')
        fahmi.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))
        // Force it to keep the current session
        fahmi.onStateChanged((state) => {
            console.log('[Client State]', state)
            if (state === 'CONFLICT' || state === 'UNLAUNCHED') fahmi.forceRefocus()
        })
        // listening on message
        fahmi.onMessage((async (message) => {

        fahmi.getAmountOfLoadedMessages() // Cut message Cache if cache more than 3K
            .then((msg) => {
                if (msg >= 1000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    fahmi.cutMsgCache()
                }
            })
        // msgHndlr(fahmi, message)
        // Message Handler (Loaded from recent cache)
        require('./fahmi.js')(fahmi, message)
    }))
           

        fahmi.onGlobalParicipantsChanged((async (heuh) => {
            await welcome(fahmi, heuh) 
            left(fahmi, heuh)
            }))
        
        fahmi.onAddedToGroup(async (chat) => {
            if(isWhite(chat.id)) return fahmi.sendText(chat.id, 'Halo aku Elaina, Ketik #help Untuk Melihat List Command Ku...')
            if(mtcState === false){
                const groups = await fahmi.getAllGroups()
                // BOT group count less than
                if(groups.length > groupLimit){
                    await fahmi.sendText(chat.id, 'Maaf, Batas group yang dapat Elaina tampung sudah penuh').then(async () =>{
                        fahmi.deleteChat(chat.id)
                        fahmi.leaveGroup(chat.id)
                    })
                }else{
                    if(chat.groupMetadata.participants.length < memberLimit){
                        await fahmi.sendText(chat.id, `Maaf, BOT keluar jika member group tidak melebihi ${memberLimit} orang`).then(async () =>{
                            fahmi.deleteChat(chat.id)
                            fahmi.leaveGroup(chat.id)
                        })
                    }else{
                        if(!chat.isReadOnly) fahmi.sendText(chat.id, 'Halo aku Elaina, Ketik #help Untuk Melihat List Command Ku...')
                    }
                }
            }else{
                await fahmi.sendText(chat.id, 'Elaina sedang maintenance, coba lain hari').then(async () => {
                    fahmi.deleteChat(chat.id)
                    fahmi.leaveGroup(chat.id)
                })
            }
        })

        /*fahmi.onAck((x => {
            const { from, to, ack } = x
            if (x !== 3) fahmi.sendSeen(to)
        }))*/

        // listening on Incoming Call
        fahmi.onIncomingCall(( async (call) => {
            await fahmi.sendText(call.peerJid, 'Maaf, saya tidak bisa menerima panggilan. nelfon = block!.\nJika ingin membuka block harap chat Owner!')
            .then(() => fahmi.contactBlock(call.peerJid))
        }))
    }

/**
 * Uncache if there is file change
 * @param {string} module Module name or path
 * @param {function} cb <optional> 
 */
function nocache(module, cb = () => { }) {
    console.log('Module', `'${module}'`, 'is now being watched for changes')
    fs.watchFile(require.resolve(module), async () => {
        await uncache(require.resolve(module))
        cb(module)
    })
}

/**
 * Uncache a module
 * @param {string} module Module name or path
 */
function uncache(module = '.') {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(module)]
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

create(options(true, start))
    .then(fahmi => start(fahmi))
    .catch((error) => console.log(error))
