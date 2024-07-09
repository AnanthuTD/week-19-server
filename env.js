import { cleanEnv, str, num, port, url } from "envalid";

// INFO: using $env to differentiate it from process.env
export const $env = cleanEnv(process.env, {
   PORT: port(),
   NODE_ENV: str({ choices: ["development", "test", "production", "staging"] }),
   DB_URI: str(),
   SESSION_SECRET_KEY: str(),
   DB_NAME: str(),
   CLIENT_SECRET: str(),
   CLIENT_ID: str(),
   ACCESS_TOKEN_SECRET: str(),
   REFRESH_TOKEN_SECRET: str(),
   REFRESH_TOKEN_EXP: num({ default: 30 }),
   ACCESS_TOKEN_EXP: str({default: '15m'}),
   REDIS_URL: url(),
});

$env.isProduction; // true if NODE_ENV === 'production'
$env.isTest; // true if NODE_ENV === 'test'
$env.isDev; // true if NODE_ENV === 'development'
