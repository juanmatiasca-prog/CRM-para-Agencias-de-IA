/**
 * Inicializacion del SDK de Firebase para el cliente.
 *
 * La configuracion web de Firebase no es secreta (viaja en el bundle del
 * navegador), pero se lee de variables de entorno para no fijarla en el codigo
 * y poder apuntar a otro proyecto sin tocar fuentes. Ver `.env.example`.
 *
 * La seguridad real la dan las Security Rules, App Check y las restricciones
 * de la API key en Google Cloud Console, nunca el ocultamiento de estos valores.
 *
 * La inicializacion es PEREZOSA a proposito. Con `output: "export"`, Next.js
 * prerenderiza las paginas en Node durante el build; si `getAuth()` corriera al
 * importar el modulo, el build fallaria con `auth/invalid-api-key` cuando las
 * variables de entorno no estan presentes. Por eso nada se inicializa hasta que
 * el navegador lo pide.
 */
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * ID de la base de datos de Firestore. No es la `(default)`: el proyecto usa
 * una base de datos con nombre, asi que hay que pasarla explicitamente a
 * `getFirestore`. Olvidarlo apunta silenciosamente a una base que no existe.
 */
export const FIRESTORE_DATABASE_ID = "mkt-hackers-db-id";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True cuando hay configuracion suficiente para hablar con Firebase. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!appInstance) {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return appInstance;
}

/**
 * Devuelve la instancia de Auth, creandola en la primera llamada.
 * Solo debe invocarse en el navegador y con la configuracion presente.
 */
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

/**
 * Devuelve la instancia de Firestore apuntando a la base de datos con nombre.
 * Igual que Auth, se crea perezosamente y solo debe usarse en el navegador.
 */
export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp(), FIRESTORE_DATABASE_ID);
  }
  return dbInstance;
}
