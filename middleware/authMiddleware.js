import passport from "passport";
import { Strategy as BearerStrategy } from "passport-http-bearer";
import jwt from "jsonwebtoken";
import { $env } from "../env.js";

passport.use(
   "user",
   new BearerStrategy((token, done) => {
      try {
         const decodedToken = jwt.verify(token, $env.ACCESS_TOKEN_SECRET, {
            ignoreExpiration: true,
         });

         return done(null, decodedToken);
      } catch (error) {
         return done(error, false);
      }
   })
);

// Strategy for administrators
passport.use(
   "admin",
   new BearerStrategy((token, done) => {
      try {
         const decodedToken = jwt.verify(token, $env.ACCESS_TOKEN_SECRET, {
            ignoreExpiration: true,
         });

         const { role } = decodedToken;

         // Check if the user is an admin
         if (role === "admin") {
            return done(null, decodedToken);
         }

         return done(null, false);
      } catch (error) {
         return done(error, false);
      }
   })
);

const adminAuthMiddleware = passport.authenticate("admin", { session: false });
const userAuthMiddleware = passport.authenticate("user", { session: false });

export { userAuthMiddleware, adminAuthMiddleware };
