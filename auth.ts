// TODO: Check if this messes up things in the app
// import NextAuth from 'next-auth';
// import { authConfig } from './auth.config';
// import Credentials from 'next-auth/providers/credentials';
// import { z } from 'zod';
// import { sql } from '@vercel/postgres';
// import type { User } from '@/app/lib/definitions';
// import bcrypt from 'bcrypt';

// // function to get the user fromt the database
// async function getUser(email: string): Promise<User | undefined> {
//   try {
//     // sql command (return type User)
//     const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
//     // get the first result
//     return user.rows[0];
//   } catch (error) {
//     // fire off an error if not found
//     console.error('Failed to fetch user:', error);
//     throw new Error('Failed to fetch user.');
//   }
// }

// // deconstruct the NextAuth methods
// export const { auth, signIn, signOut } = NextAuth({
//   ...authConfig,
//   providers: [
//     // Credentials will allows users to login with username and password
//     Credentials({
//       // authorize callback to be checked by NextAuth
//       async authorize(credentials) {
//         // validate the credentials with zod
//         const parsedCredentials = z
//           .object({ email: z.string().email(), password: z.string().min(6) })
//           .safeParse(credentials);

//         // if the credentials are valid, get the user from the database
//         if (parsedCredentials.success) {
//           const { email, password } = parsedCredentials.data;
//           const user = await getUser(email);
//           // otherwise return null
//           if (!user) return null;

//           // check if password matches the database password using bcrypt
//           const passwordMatches = await bcrypt.compare(password, user.password);

//           // if the password matches, return the user
//           if (passwordMatches) return user;
//         }

//         // otherwise log error and return null
//         console.log('Invalid credentials.');
//         return null;
//       },
//     }),
//   ],
// });
