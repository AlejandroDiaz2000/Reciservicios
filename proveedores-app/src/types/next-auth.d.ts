import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      cargo?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    rol: string;
    cargo?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: string;
    cargo?: string;
  }
}
