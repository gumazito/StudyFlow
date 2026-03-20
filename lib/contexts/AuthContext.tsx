'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, updateEmail, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential, deleteUser, User as FirebaseUser,
  GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore'
import { auth, db, SYSTEM_ADMIN_EMAIL, SUPER_USER_EMAILS, ALWAYS_PREMIUM_EMAILS } from '@/lib/firebase'

export interface UserProfile {
  id: string
  name: string
  email: string
  roles: string[]
  status: 'pending' | 'approved' | 'rejected'
  isAdmin: boolean
  dob?: string
  yearLevel?: string
  onboardingComplete?: boolean
  manualPremium?: boolean
  subscriptionStatus?: string
  emailNotifications?: boolean
  notificationPrefs?: any
  interests?: string[]
  studyGoal?: string
  createdAt?: number
  authProvider?: string
  premiumGrantedBy?: string
  premiumGrantedAt?: number
  [key: string]: any // Allow additional Firestore fields
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string, roles: string[], dob?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  changeEmail: (newEmail: string, currentPassword: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteAccount: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
  loginWithMicrosoft: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function dobToYearLevel(dob: string): string | null {
  if (!dob) return null
  const birthDate = new Date(dob)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthAdj = (today.getMonth() - birthDate.getMonth()) < 0 ? -1 : 0
  const actualAge = age + monthAdj
  const yearLevel = Math.min(12, Math.max(7, actualAge - 5))
  return `Year ${yearLevel}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const docRef = doc(db, "users", fbUser.uid)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const profile = snap.data()
          // Migration: old single role to roles array
          let roles = profile.roles || [profile.role || "learner"]
          let status = profile.status || "approved"
          const isSuperUser = SUPER_USER_EMAILS.includes(fbUser.email?.toLowerCase() || '')
          const isAdmin = fbUser.email === SYSTEM_ADMIN_EMAIL || isSuperUser || roles.includes("admin")

          // Auto-grant admin + approved to super users
          if (isSuperUser && (!roles.includes("admin") || status !== "approved")) {
            roles = [...new Set([...roles, "admin"])]
            status = "approved"
            await setDoc(docRef, { roles, status }, { merge: true })
          }

          // Auto-grant premium to always-premium accounts
          if (ALWAYS_PREMIUM_EMAILS.includes(fbUser.email?.toLowerCase() || '') && !profile.manualPremium) {
            await setDoc(docRef, { manualPremium: true, premiumGrantedBy: 'system', premiumGrantedAt: Date.now() }, { merge: true })
          }
          
          setUser({
            id: fbUser.uid, name: profile.name, email: fbUser.email!,
            roles, status, isAdmin,
            dob: profile.dob || undefined,
            yearLevel: profile.yearLevel || undefined,
          })
        } else {
          setUser({
            id: fbUser.uid, name: fbUser.email!, email: fbUser.email!,
            roles: ["learner"], status: "pending", isAdmin: false,
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signup = async (email: string, password: string, name: string, roles: string[], dob?: string) => {
    const emailLower = email.toLowerCase()
    const isSuperUser = SUPER_USER_EMAILS.includes(emailLower)
    const isPremium = ALWAYS_PREMIUM_EMAILS.includes(emailLower)
    const finalRoles = isSuperUser ? [...new Set([...roles, "admin"])] : roles
    const status = isSuperUser ? "approved" : "pending"
    const yearLevel = dob ? dobToYearLevel(dob) : null

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, "users", cred.user.uid), {
      name, email, roles: finalRoles, status, dob: dob || null,
      yearLevel, createdAt: Date.now(),
      ...(isPremium ? { manualPremium: true, premiumGrantedBy: 'system', premiumGrantedAt: Date.now() } : {}),
    })

    // Notify admin of new signup (unless super user)
    if (!isSuperUser) {
      const notifRef = collection(db, "admin_notifications")
      await setDoc(doc(notifRef), {
        type: "new_signup", userName: name, userEmail: email,
        userRoles: finalRoles, userId: cred.user.uid,
        message: `New signup: ${name} (${email}) requesting ${finalRoles.join(", ")} access`,
        createdAt: Date.now(), read: false,
      })
    }
  }

  const handleSocialLogin = async (provider: any) => {
    const result = await signInWithPopup(auth, provider)
    const fbUser = result.user
    const docRef = doc(db, "users", fbUser.uid)
    const snap = await getDoc(docRef)
    const emailLower = fbUser.email?.toLowerCase() || ''
    const isSuperUser = SUPER_USER_EMAILS.includes(emailLower)
    const isPremium = ALWAYS_PREMIUM_EMAILS.includes(emailLower)

    if (!snap.exists()) {
      // First time social login — create user record
      const roles = isSuperUser ? ['learner', 'admin'] : ['learner']
      const status = isSuperUser ? 'approved' : 'pending'

      await setDoc(docRef, {
        name: fbUser.displayName || fbUser.email || 'User',
        email: fbUser.email,
        roles,
        status,
        createdAt: Date.now(),
        authProvider: provider.providerId,
        ...(isPremium ? { manualPremium: true, premiumGrantedBy: 'system', premiumGrantedAt: Date.now() } : {}),
      })
      // Notify admin (skip for super users)
      if (!isSuperUser) {
        await setDoc(doc(collection(db, "admin_notifications")), {
          type: "new_signup", userName: fbUser.displayName || fbUser.email,
          userEmail: fbUser.email, userRoles: roles, userId: fbUser.uid,
          message: `New social signup: ${fbUser.displayName || fbUser.email} via ${provider.providerId}`,
          createdAt: Date.now(), read: false,
        })
      }

      // Immediately set user state to avoid race condition with onAuthStateChanged
      setUser({
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email || 'User',
        email: fbUser.email!,
        roles,
        status,
        isAdmin: isSuperUser,
      })
    } else {
      // Existing user — re-read and apply super user logic
      const profile = snap.data()
      let roles = profile.roles || [profile.role || 'learner']
      let status = profile.status || 'approved'
      const isAdmin = isSuperUser || roles.includes('admin')

      if (isSuperUser && (!roles.includes('admin') || status !== 'approved')) {
        roles = [...new Set([...roles, 'admin'])]
        status = 'approved'
        await setDoc(docRef, { roles, status }, { merge: true })
      }

      if (isPremium && !profile.manualPremium) {
        await setDoc(docRef, { manualPremium: true, premiumGrantedBy: 'system', premiumGrantedAt: Date.now() }, { merge: true })
      }

      setUser({
        id: fbUser.uid,
        name: profile.name || fbUser.displayName || fbUser.email!,
        email: fbUser.email!,
        roles,
        status,
        isAdmin,
      })
    }
  }

  const loginWithGoogle = async () => {
    await handleSocialLogin(new GoogleAuthProvider())
  }

  const loginWithApple = async () => {
    await handleSocialLogin(new OAuthProvider('apple.com'))
  }

  const loginWithMicrosoft = async () => {
    await handleSocialLogin(new OAuthProvider('microsoft.com'))
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return
    await setDoc(doc(db, "users", user.id), data as any, { merge: true })
    setUser(prev => prev ? { ...prev, ...data } : null)
  }

  const changeEmail = async (newEmail: string, currentPassword: string) => {
    const fbUser = auth.currentUser
    if (!fbUser || !fbUser.email) throw new Error("Not logged in")
    const credential = EmailAuthProvider.credential(fbUser.email, currentPassword)
    await reauthenticateWithCredential(fbUser, credential)
    await updateEmail(fbUser, newEmail)
    await setDoc(doc(db, "users", user!.id), { email: newEmail }, { merge: true })
    setUser(prev => prev ? { ...prev, email: newEmail } : null)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const fbUser = auth.currentUser
    if (!fbUser || !fbUser.email) throw new Error("Not logged in")
    const credential = EmailAuthProvider.credential(fbUser.email, currentPassword)
    await reauthenticateWithCredential(fbUser, credential)
    await updatePassword(fbUser, newPassword)
  }

  const deleteAccount = async () => {
    if (!user) return
    const uid = user.id
    // Delete user data from Firestore
    const collections = ["gamification", "ai_config"]
    for (const col of collections) {
      try { await deleteDoc(doc(db, col, uid)) } catch {}
    }
    // Delete queried collections
    const queriedCollections = ["test_results", "learner_progress", "spaced_rep"]
    for (const col of queriedCollections) {
      try {
        const q2 = query(collection(db, col), where("userId", "==", uid))
        const snap = await getDocs(q2)
        for (const d of snap.docs) await deleteDoc(d.ref)
      } catch {}
    }
    // Delete user profile
    await deleteDoc(doc(db, "users", uid))
    // Delete Firebase Auth account
    const fbUser = auth.currentUser
    if (fbUser) await deleteUser(fbUser)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, resetPassword, updateProfile, changeEmail, changePassword, deleteAccount, loginWithGoogle, loginWithApple, loginWithMicrosoft }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
