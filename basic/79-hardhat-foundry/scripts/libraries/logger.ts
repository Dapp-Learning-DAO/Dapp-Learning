import chalk from "chalk";

const log = (...message: any[]) => write(...plainObject(message));
const success = (...message: any[]) => write(chalk.green(...plainObject(message)));
const warning = (...message: any[]) => write(chalk.yellow(...plainObject(message)));
const info = (...message: any[]) => write(chalk.blue(...plainObject(message)));
const error = (...message: any[]) => write(chalk.red(...plainObject(message)))
const debug = (...message: any[]) => write(chalk.whiteBright("🔧 [DEBUG]", ...plainObject(message)))
const write = (...message: any[]): void => {
    if (process.env.APP_ENV !== "test") {
        // TODO 记录日志
        console.log(...message);
    }
};
const plainObject = (message: any[]): any[] => {
    const wrapped: any[] = []
    for (const item of message) {
        if (typeof item === "object") {
            try {
                wrapped.push(JSON.stringify(item))
            } catch (e) {
                wrapped.push(item)
            }
        } else {
            wrapped.push(item)
        }
    }
    return wrapped
};

export default {success, warning, info, error, log, debug};
