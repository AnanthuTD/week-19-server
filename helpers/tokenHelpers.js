import redisClient from '../config/redisClient.js'
import { $env } from "../env.js";
import jwt from 'jsonwebtoken'

export function createAccessToken({ userData }) {
   return jwt.sign(userData, $env.ACCESS_TOKEN_SECRET, {
      expiresIn: $env.ACCESS_TOKEN_EXP,
   });
}

export function createRefreshToken({ userData }) {

   const refreshToken = jwt.sign(userData, $env.REFRESH_TOKEN_SECRET, {
      expiresIn: `${$env.REFRESH_TOKEN_EXP}d`,
   });

   return refreshToken;

   // TODO: STORE REFRESH TOKEN IN DATABASE FOR INVALIDATING
}

export async function invalidateRefreshToken(token, expiresIn) {
   await redisClient.set(token, "invalid", { EX: expiresIn });
}

export async function verifyRefreshToken(refreshToken) {
   const tokenStatus = await redisClient.get(refreshToken);
   if (tokenStatus === "invalid") {
      return {
         tokenDetails: null,
         error: true,
         message: "Invalid refresh token",
      };
   }
   const decodedToken = jwt.verify(refreshToken, $env.REFRESH_TOKEN_SECRET);
   delete decodedToken.exp
   return {
      tokenDetails: decodedToken,
      error: false,
      message: "Valid refresh token",
   };
}

export function getRefreshTokenExp(){
   const expiryInSec = 60 * 60 * 24 * $env.REFRESH_TOKEN_EXP;
   const currentDate = new Date();
   return new Date(currentDate.getTime() + expiryInSec * 1000);
}