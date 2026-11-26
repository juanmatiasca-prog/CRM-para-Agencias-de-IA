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
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

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
let storageInstance: FirebaseStorage | null = null;
let appCheckInstance: AppCheck | null = null;
let appCheckTried = false;

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

/**
 * Devuelve la instancia de Cloud Storage, donde viven los archivos adjuntos.
 * Usa el bucket por defecto del proyecto, el declarado en
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.
 */
export function getStorageBucket(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
  }
  return storageInstance;
}

// ---------------------------------------------------------------
// App Check
// ---------------------------------------------------------------

/**
 * True cuando la app corre en una maquina de desarrollo.
 *
 * reCAPTCHA Enterprise no funciona en localhost, y la documentacion de Firebase
 * advierte expresamente de NO anadir `localhost` a los dominios de una clave de
 * produccion. La via correcta en local es el token de depuracion.
 */
export function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
}

/** Clave de sitio de reCAPTCHA Enterprise. Vacia hasta que se cree en la consola. */
const APP_CHECK_SITE_KEY = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY ?? "";

/**
 * Marcador usado solo en local cuando todavia no hay clave de sitio.
 *
 * En modo depuracion el SDK no atestigua con reCAPTCHA: canjea el token de
 * depuracion. El proveedor se sigue construyendo, de ahi que haga falta pasarle
 * algo. Este valor NO sirve en produccion.
 */
const LOCAL_PLACEHOLDER_SITE_KEY = "app-check-sin-clave-solo-local";

/**
 * Inicializa App Check una sola vez y devuelve la instancia.
 *
 * Llamarla antes de usar Firebase AI Logic: el proyecto tiene App Check
 * IMPUESTO sobre AI Logic, asi que sin token las llamadas al modelo responden
 * 403.
 *
 * En desarrollo local activa el modo depuracion. La linea
 * `self.FIREBASE_APPCHECK_DEBUG_TOKEN` tiene que ejecutarse ANTES de
 * `initializeAppCheck`, tal como exige la documentacion; por eso va aqui dentro
 * y no en un modulo aparte.
 *
 * Nunca lanza: si App Check no puede inicializarse, el resto de la aplicacion
 * (Auth, Firestore, Storage) debe seguir funcionando.
 */
export function ensureAppCheck(): AppCheck | null {
  if (typeof window === "undefined") return null;
  if (appCheckTried) return appCheckInstance;
  appCheckTried = true;

  const local = isLocalDevHost();

  if (local) {
    // `true` hace que el SDK genere un token y lo imprima en la consola del
    // navegador. Si se define la variable de entorno, se usa ese token concreto,
    // util para reutilizar el mismo entre navegadores o maquinas.
    const fixedToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN;
    (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN =
      fixedToken && fixedToken.length > 0 ? fixedToken : true;
  }

  if (!APP_CHECK_SITE_KEY && !local) {
    // En produccion sin clave de sitio no se inicializa nada: mas vale un fallo
    // claro en la funcion de IA que una atestacion falsa.
    console.warn(
      "[App Check] Falta NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY. " +
        "Las funciones de IA fallaran con 403 hasta que se configure.",
    );
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(getFirebaseApp(), {
      provider: new ReCaptchaEnterpriseProvider(
        APP_CHECK_SITE_KEY || LOCAL_PLACEHOLDER_SITE_KEY,
      ),
      isTokenAutoRefreshEnabled: true,
    });

    if (local) {
      console.info(
        "[App Check] Modo depuracion activo. Busca arriba la linea " +
          '"AppCheck debug token: ..." y registra ese token en la consola de ' +
          "Firebase: Security > App Check > Apps > menu de tres puntos > " +
          "Manage debug tokens.",
      );
    }
  } catch (cause) {
    console.warn("[App Check] No se pudo inicializar.", cause);
    appCheckInstance = null;
  }

  return appCheckInstance;
}
