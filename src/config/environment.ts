import "dotenv/config";

const required = [
  "MONGODB_URI",
  "JWT_SECRET"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `Missing required environment variable: ${key}`
    );
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT || 5000),

  mongoUri: process.env.MONGODB_URI as string,

  jwtSecret: process.env.JWT_SECRET as string,

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN || "7d",

  clientUrl:
    process.env.CLIENT_URL || "*",

  pairingTokenExpiresMinutes:
    Number(
      process.env.PAIRING_TOKEN_EXPIRES_MINUTES || 5
    )
};