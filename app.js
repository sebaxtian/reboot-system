const reboot = require('nodejs-system-reboot');
const nodemailer = require('nodemailer');
const moment = require('moment');
const gmail = require("./credenciales/gmail.js");
const fs = require('fs');


// Path del directorio de archivos Log
let pathDirLogs = './logs/';
// Archivo de Log
let logFile = 'check-0.log';
// Configuracion de archivo Log
loadFileLog();


// Funcion que configura el archivo de Log que sera escrito
function loadFileLog() {
    // Archivos del directorio de Logs ordenados por fecha de modificacion
    let logFiles = fs.readdirSync(pathDirLogs);
    logFiles.sort(function(a, b) {
        return fs.statSync(pathDirLogs + a).mtime.getTime() - fs.statSync(pathDirLogs + b).mtime.getTime();
    });
    // Obtiene el ultimo archivo modificado
    logFile = logFiles[logFiles.length - 1]
    // Valida si existe el archivo
    if(logFile != null) {
        console.log('Ultimo archivo modificado: ' + logFile);
        // Validar el tamanio del archivo
        let stats = fs.statSync(pathDirLogs + logFile);
        let fileSizeInBytes = stats.size;
        console.log('File Size: ' + fileSizeInBytes + ' Bytes');
        // 524288 == 0.5 MB
        if(fileSizeInBytes > 524288) {
            // El archivo es demasiado grande, se crea un nuevo archivo de log
            var res = logFile.split("-")[1].split(".")[0];
            res++;
            logFile = 'check-' + res + '.log';
        }
    } else {
        logFile = 'check-0.log';
    }
}

// Funcion que escribe un mensaje sobre un archivo de Log
function saveLog(mensaje) {
    // Escribe el mensaje sobre el archivo de Log
    fs.appendFile(pathDirLogs + logFile, mensaje, function (err) {
        if (err) console.log('Error al escribir mensaje sobre archivo de Log ' + logFile);
        console.log('Exito al escribir mensaje sobre archivo de Log ' + logFile);
    });
}

// Funcion que envia un email usando el API de Gmail
function sendEmail(para, asunto, mensaje) {
    // Nodemailer
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            type: 'OAuth2',
            user: gmail.auth.user,
            clientId: gmail.auth.clientId,
            clientSecret: gmail.auth.clientSecret,
            refreshToken: gmail.auth.refreshToken
        }
    });
    let mailsolicitante = {
        from: gmail.auth.name + ' <' + gmail.auth.user + '>',
        bcc: para,
        subject: asunto,
        text: mensaje
    };
    transporter.sendMail(mailsolicitante, function (error, success) {
        if(error) {
            console.log("Error al enviar Email [ERROR::Nodemailer]");
        } else {
            console.log("Exito al enviar Email");
        }
    });
}

