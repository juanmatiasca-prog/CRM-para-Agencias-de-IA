"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { ensureProfile } from "@/lib/repo";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Traduce los codigos de error de Firebase Auth a mensajes en castellano.
 * Firebase devuelve `auth/invalid-credential` tanto si el email no existe como
 * si la contrasena es incorrecta, asi que el mensaje no distingue los casos.
 */
export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Ese correo no tiene un formato valido.";
    case "auth/missing-password":
      return "Escribe tu contrasena.";
    case "auth/weak-password":
      return "La contrasena debe tener al menos 6 caracteres.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo. Inicia sesion.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contrasena incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Prueba de nuevo en unos minutos.";
    case "auth/network-request-failed":
      return "No hay conexion con Firebase. Revisa tu red.";
    case "auth/operation-not-allowed":
      return "El acceso por correo y contrasena no esta habilitado en el proyecto de Firebase.";
    default:
      return "No se pudo completar la operacion. Intentalo de nuevo.";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      // El documento de perfil debe existir antes de que la app escriba nada
      // bajo /users/{uid}. Se reescribe con merge en cada acceso, asi que
      // tambien sirve para refrescar el nombre si el usuario lo cambia.
      if (nextUser) {
        void ensureProfile(
          nextUser.uid,
          nextUser.displayName ?? "",
          nextUser.email ?? "",
        ).catch(() => {
          // Un fallo aqui no debe impedir el uso de la app: las reglas
          // permiten escribir clientes aunque el perfil no se haya creado.
        });
      }
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );
      const displayName = name.trim();
      if (displayName) {
        await updateProfile(credential.user, { displayName });
        // onAuthStateChanged no vuelve a emitir tras updateProfile.
        setUser({ ...credential.user, displayName } as User);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      signIn,
      signUp,
      logout,
    }),
    [user, loading, signIn, signUp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
