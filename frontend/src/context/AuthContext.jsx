import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
} from "firebase/auth";
import { auth, githubProvider, googleProvider } from "../firebase";
import client from "../api/client";

const AuthContext = createContext(null);

function friendlyAuthError(
  err,
  fallback = "Authentication failed. Please try again."
) {
  const code = err?.code || "";

  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found")
  ) {
    return "Invalid email or password.";
  }

  if (code.includes("popup-closed-by-user")) {
    return "Sign-in popup was closed before completion.";
  }

  if (code.includes("account-exists-with-different-credential")) {
    return "An account already exists with this email using another login method.";
  }

  return err?.response?.data?.message || fallback;
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState("");
  const [profileChecked, setProfileChecked] = useState(false);

  const syncProfile = useCallback(async () => {
    setProfileChecked(false);

    try {
      const { data } = await client.post("/users/sync");

      const syncedUser = data?.user || null;

      setProfile(syncedUser);
      setProfileChecked(true);

      return syncedUser;
    } catch (err) {
      console.error("Failed to sync profile:", err);

      setProfile(null);
      setAuthError(
        friendlyAuthError(
          err,
          "Could not verify your profile. Please try again."
        )
      );
      setProfileChecked(true);

      return null;
    }
  }, []);

  const refreshProfile = useCallback(
    async () => syncProfile(),
    [syncProfile]
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setAuthError("");
      setProfileChecked(false);
      setFirebaseUser(user);

      if (user) {
        try {
          setToken(await user.getIdToken());
          await syncProfile();
        } catch (err) {
          console.error("Auth state sync failed:", err);

          setAuthError(
            friendlyAuthError(
              err,
              "Could not restore your session."
            )
          );

          setProfile(null);
          setProfileChecked(true);
        }
      } else {
        setToken("");
        setProfile(null);
        setProfileChecked(true);
      }

      setLoading(false);
    });

    return unsub;
  }, [syncProfile]);

  const loginWithEmail = async (email, password) => {
    setAuthError("");
    setProfileChecked(false);
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setFirebaseUser(result.user);
      setToken(await result.user.getIdToken());

      return await syncProfile();
    } catch (err) {
      console.error(err);

      const message = friendlyAuthError(
        err,
        "Email login failed. Please try again."
      );

      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithProvider = async (provider, label) => {
    setAuthError("");
    setProfileChecked(false);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);

      setFirebaseUser(result.user);
      setToken(await result.user.getIdToken());

      return await syncProfile();
    } catch (err) {
      console.error(err);

      const message = friendlyAuthError(
        err,
        `${label} sign-in failed. Please try again.`
      );

      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = () =>
    loginWithProvider(googleProvider, "Google");

  const signInWithGithub = () =>
    loginWithProvider(githubProvider, "GitHub");

  const signOutUser = async () => {
    await fbSignOut(auth);

    setFirebaseUser(null);
    setProfile(null);
    setToken("");
    setProfileChecked(false);
  };

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      hasProfile: Boolean(profile?.profileComplete),
      loading,
      profileChecked,
      authError,
      token,
      loginWithEmail,
      signInWithGoogle,
      signInWithGithub,
      signOutUser,
      refreshProfile,
      setAuthError,
    }),
    [
      firebaseUser,
      profile,
      loading,
      profileChecked,
      authError,
      token,
      refreshProfile,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside <AuthProvider>"
    );
  }

  return ctx;
}