const reboot = require('nodejs-system-reboot');
const nodemailer = require('nodemailer');
const moment = require('moment');
const gmail = require("./credenciales/gmail.js");
const fs = require('fs');


// Path del directorio de archivos Log
let pathDirLogs = './logs/';
// Archivo de Log
let logFile = 'reboot-0.log';
// Configuracion de archivo Log
loadFileLog();


// Nombre del Sistema
const systemName = 'ThinkStation Server';


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
            logFile = 'reboot-' + res + '.log';
        }
    } else {
        logFile = 'reboot-0.log';
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

// Funcion que ejecuta el programa
function init() {
    console.log('');
    console.log('reboot-system');
    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
    console.log('');
    // Obtiene el argumento enviado desde linea de comandos
    let inicia = (process.argv[2] == 'false');
    // Valida cuando inicia o reinicia el sistema
    if(inicia) {
        // El sistema ha iniciado
        //console.log('El sistema ha iniciado.');
        // Configurar mensaje para notificar mediante un Email
        let mensaje = '----------------------------------------------------\n';
        mensaje += 'Hora Local: ' + moment().format('MMMM Do YYYY, h:mm:ss a') + '\n';
        mensaje += 'El sistema ' + systemName + ' ha iniciado.' + '\n';
        mensaje += '----------------------------------------------------\n\n';
        console.log(mensaje);
        // Escribe sobre archivo de Log
        saveLog(mensaje);
        // Configurar mensaje para notificar mediante un Email
        let para = 'sebaxtianrioss@gmail.com';
        let asunto = 'Reboot System';
        mensaje += '\n\nPor favor valide si el sistema ' + systemName + ' esta activo.\n\n';
        // Envia el mensaje
        sendEmail(para, asunto, mensaje);
    } else {
        // El sistema sera reiniciado
        //console.log('El sistema sera reiniciado.');
        let promesa = new Promise((resolve, reject) => {
            // Llamamos a resolve(...) cuando lo que estabamos haciendo finaliza con exito, y reject(...) cuando falla.
            // Variable para configurar los minutos de espera antes de reiniciar el sistema
            // 300000 == 5 minutos
            let minutos = 300000;
            // Configurar mensaje para notificar mediante un Email
            let mensaje = '----------------------------------------------------\n';
            mensaje += 'Hora Local: ' + moment().format('MMMM Do YYYY, h:mm:ss a') + '\n';
            mensaje += 'El sistema ' + systemName + ' sera reiniciado en ' + (minutos / 60000) + ' minutos. \n';
            mensaje += '----------------------------------------------------\n\n';
            console.log(mensaje);
            // Escribe sobre archivo de Log
            saveLog(mensaje);
            // Configurar mensaje para notificar mediante un Email
            let para = 'sebaxtianrioss@gmail.com';
            let asunto = 'Reboot System';
            mensaje += '\n\nPor favor valide si el sistema ' + systemName + ' es reiniciado.\n\n';
            // Envia el mensaje
            sendEmail(para, asunto, mensaje);
            // Espera 5 minutos para luego reiniciar el sistema
            setTimeout(function(){
                // Resuelve la promesa
                resolve('reiniciar');
            }, minutos);
        });
        // Cuando la promesa se resuelve, reinicia el sistema
        promesa.then((successMessage) => {
            // succesMessage es lo que sea que pasamos en la función resolve(...) de arriba.
            if(successMessage == 'reiniciar') {
                // Reinicia el sistema inmediatamente
                reboot( function (err, stderr, stdout) {
                    // Valida si es posible reinicar el sistema inmediatamente
                    if(!err && !stderr) {
                        // Si es posible reiniciar el sistema inmediatamente
                        console.log(stdout);
                    } else {
                        // No es posible reiniciar el sistema
                        //console.log('error: ' + err + '; stderr: ' + stderr);
                        // Configurar mensaje para notificar mediante un Email
                        let mensaje = '----------------------------------------------------\n';
                        mensaje += 'Hora Local: ' + moment().format('MMMM Do YYYY, h:mm:ss a') + '\n';
                        mensaje += 'No fue posible reiniciar el sistema ' + systemName + '\n';
                        mensaje += 'error: ' + err + '\n';
                        mensaje += 'stderr: ' + stderr + '\n';
                        mensaje += '----------------------------------------------------\n\n';
                        console.log(mensaje);
                        // Escribe sobre archivo de Log
                        saveLog(mensaje);
                        // Configurar mensaje para notificar mediante un Email
                        let para = 'sebaxtianrioss@gmail.com';
                        let asunto = 'Reboot System';
                        mensaje += '\n\nPor favor valide si el sistema ' + systemName + ' fue reinicado.\n\n';
                        // Envia el mensaje
                        sendEmail(para, asunto, mensaje);
                    }
                });
            }
        });
    }
}

// Inicia la ejecucion del programa
init();
