const chalk = require('chalk');

/**
 * Custom Logger mirip dengan Ourin
 */
const color = (text, colorCode) => {
    return !colorCode ? chalk.green(text) : chalk.keyword(colorCode)(text);
};

const bgLogger = (text, bg) => {
    return chalk.bgKeyword(bg)(chalk.black(text));
};

const customLogger = {
    info: (msg) => {
        console.log(`${bgLogger(' INFO ', 'cyan')} ${chalk.cyan(msg)}`);
    },
    success: (msg) => {
        console.log(`${bgLogger(' SUCCESS ', 'green')} ${chalk.greenBright(msg)}`);
    },
    error: (msg) => {
        console.log(`${bgLogger(' ERROR ', 'red')} ${chalk.redBright(msg)}`);
    },
    warn: (msg) => {
        console.log(`${bgLogger(' WARN ', 'yellow')} ${chalk.yellow(msg)}`);
    },
    chat: (from, msgText) => {
        console.log(`${bgLogger(' MSG ', 'magenta')} ${chalk.magentaBright(`[${from}]`)} ${chalk.white(msgText)}`);
    },
    plugin: (msg) => {
        console.log(`${bgLogger(' PLUGIN ', 'blue')} ${chalk.blueBright(msg)}`);
    }
};

module.exports = { color, bgLogger, customLogger };
