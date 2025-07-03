import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

googleProvider.addScope('email');
googleProvider.addScope('profile');

export class FirebaseAuthService {
  private static instance: FirebaseAuthService;
  private currentUser: any = null;
  private authStateListeners: ((user: any) => void)[] = [];

  private constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateListeners.forEach(listener => listener(user));
    });
  }

  static getInstance(): FirebaseAuthService {
    if (!FirebaseAuthService.instance) {
      FirebaseAuthService.instance = new FirebaseAuthService();
    }
    return FirebaseAuthService.instance;
  }

  async signInWithGoogle(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const idToken = await user.getIdToken();
      localStorage.setItem('firebase_id_token', idToken);
      localStorage.setItem('firebase_user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }));

      return { success: true, user };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { 
        success: false, 
        error: error.message || 'Google認証でエラーが発生しました'
      };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('firebase_id_token');
      localStorage.removeItem('firebase_user');
      
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { 
        success: false, 
        error: error.message || 'ログアウトでエラーが発生しました'
      };
    }
  }

  async getCurrentUser(): Promise<any> {
    return new Promise((resolve) => {
      if (this.currentUser !== null) {
        resolve(this.currentUser);
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  async getIdToken(): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;
      
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  onAuthStateChanged(callback: (user: any) => void): () => void {
    this.authStateListeners.push(callback);
    
    callback(this.currentUser);

    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  getUserInfo(): { uid?: string; email?: string; displayName?: string; photoURL?: string } | null {
    if (!this.currentUser) return null;
    
    return {
      uid: this.currentUser.uid,
      email: this.currentUser.email || undefined,
      displayName: this.currentUser.displayName || undefined,
      photoURL: this.currentUser.photoURL || undefined
    };
  }
}

export const firebaseAuth = FirebaseAuthService.getInstance();