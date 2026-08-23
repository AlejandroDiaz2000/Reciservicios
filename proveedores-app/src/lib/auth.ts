import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registrarEvento } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // Sesión expira a las 8 horas de inactividad (ajustable según política interna)
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        correo: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.password) {
          return null;
        }

        const usuario = await prisma.usuario.findUnique({
          where: { correo: credentials.correo.toLowerCase().trim() },
        });

        if (!usuario || !usuario.activo) {
          return null;
        }

        const passwordValido = await bcrypt.compare(credentials.password, usuario.passwordHash);
        if (!passwordValido) {
          return null;
        }

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { ultimoLoginAt: new Date() },
        });

        await registrarEvento({
          entidad: "Usuario",
          entidadId: usuario.id,
          accion: "LOGIN",
          usuarioId: usuario.id,
        });

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          rol: usuario.rol,
          cargo: usuario.cargo ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol: string }).rol;
        token.cargo = (user as { cargo?: string }).cargo;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
        session.user.cargo = token.cargo as string | undefined;
      }
      return session;
    },
  },
};
