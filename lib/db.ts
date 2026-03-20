import { db } from './firebase'
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, addDoc, increment, Timestamp
} from 'firebase/firestore'

// ============================================================
// USERS
// ============================================================
export async function getUser(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
}

export async function grantPremium(uid: string, grantedBy: string) {
  await setDoc(doc(db, 'users', uid), {
    manualPremium: true, premiumGrantedBy: grantedBy, premiumGrantedAt: Date.now(),
  }, { merge: true })
}

export async function revokePremium(uid: string) {
  await setDoc(doc(db, 'users', uid), {
    manualPremium: false, premiumGrantedBy: null, premiumGrantedAt: null,
  }, { merge: true })
}

export async function grantGroupPremium(groupId: string, grantedBy: string) {
  await setDoc(doc(db, 'groups', groupId), {
    premiumGroup: true, premiumGrantedBy: grantedBy, premiumGrantedAt: Date.now(),
  }, { merge: true })
}

export async function updateUser(uid: string, data: any) {
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: Date.now() }, { merge: true })
}

export async function searchUsers(q: string) {
  const snap = await getDocs(collection(db, 'users'))
  const lower = q.toLowerCase().trim()
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter((u: any) => (u.email || '').toLowerCase().includes(lower) || (u.name || '').toLowerCase().includes(lower))
}

// ============================================================
// PACKAGES (COURSES)
// ============================================================
export async function savePackage(pkg: any) {
  const data = {
    ...pkg,
    facts: JSON.stringify(pkg.facts || []),
    content: JSON.stringify(pkg.content || []),
    categories: JSON.stringify(pkg.categories || []),
    testPatterns: JSON.stringify(pkg.testPatterns || null),
  }
  await setDoc(doc(db, 'packages', pkg.id), data, { merge: true })
}

export async function loadPackages() {
  const snap = await getDocs(collection(db, 'packages'))
  return snap.docs.map(d => {
    const data = d.data()
    try {
      return {
        ...data,
        facts: JSON.parse(data.facts || '[]'),
        content: JSON.parse(data.content || '[]'),
        categories: JSON.parse(data.categories || '[]'),
        testPatterns: JSON.parse(data.testPatterns || 'null'),
      }
    } catch { return data }
  })
}

export async function deletePackage(id: string) {
  await deleteDoc(doc(db, 'packages', id))
}

// ============================================================
// TEST RESULTS
// ============================================================
export async function saveTestResult(result: any) {
  await addDoc(collection(db, 'test_results'), { ...result, timestamp: Date.now() })
}

export async function getTestResultsForUser(userId: string) {
  const q2 = query(collection(db, 'test_results'), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(200))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getTestResultsForPackage(packageId: string) {
  const q2 = query(collection(db, 'test_results'), where('packageId', '==', packageId), orderBy('timestamp', 'desc'), limit(500))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllTestResults() {
  const q2 = query(collection(db, 'test_results'), orderBy('timestamp', 'desc'), limit(1000))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ============================================================
// LEARNER PROGRESS
// ============================================================
export async function saveLearnerProgress(userId: string, packageId: string, data: any) {
  const docId = `${userId}_${packageId}`
  await setDoc(doc(db, 'learner_progress', docId), { userId, packageId, ...data, updatedAt: Date.now() }, { merge: true })
}

export async function getLearnerProgress(userId: string) {
  const q2 = query(collection(db, 'learner_progress'), where('userId', '==', userId))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ============================================================
// GAMIFICATION
// ============================================================
export async function getGamification(userId: string) {
  const snap = await getDoc(doc(db, 'gamification', userId))
  return snap.exists() ? snap.data() : { xp: 0, streak: 0, lastActive: null, badges: [], level: 1 }
}

export async function updateGamification(userId: string, data: any) {
  await setDoc(doc(db, 'gamification', userId), data, { merge: true })
}

export async function getGroupLeaderboard(groupId: string) {
  const group: any = await getGroup(groupId)
  if (!group) return []
  const members = group.members || []
  const entries = await Promise.all(
    members.map(async (m: any) => {
      const gam = await getGamification(m.userId)
      const userSnap = await getDoc(doc(db, 'users', m.userId))
      const userData = userSnap.exists() ? userSnap.data() : null
      return {
        userId: m.userId,
        name: userData?.name || m.name || 'Unknown',
        xp: (gam as any).xp || 0,
        level: (gam as any).level || 1,
        streak: (gam as any).streak || 0,
      }
    })
  )
  return entries.sort((a, b) => b.xp - a.xp)
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function notifyAdmin(event: any) {
  await addDoc(collection(db, 'admin_notifications'), { ...event, createdAt: Date.now(), read: false })
}

export async function getNotifications() {
  const q2 = query(collection(db, 'admin_notifications'), orderBy('createdAt', 'desc'), limit(50))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, 'admin_notifications', id), { read: true })
}

// ============================================================
// FEEDBACK & RATINGS
// ============================================================
export async function saveFeedback(feedback: any) {
  await addDoc(collection(db, 'feedback'), { ...feedback, timestamp: Date.now(), status: 'new' })
  await notifyAdmin({
    type: 'feedback',
    message: `Feedback on "${feedback.packageName}" from ${feedback.userName}: "${(feedback.message || '').slice(0, 80)}"`,
    packageId: feedback.packageId,
    userId: feedback.userId,
  })
}

export async function getAllFeedback() {
  const q2 = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'), limit(200))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function saveRating(userId: string, packageId: string, ratings: any) {
  await setDoc(doc(db, 'ratings', `${userId}_${packageId}`), { userId, packageId, ...ratings, timestamp: Date.now() })
}

// ============================================================
// SOCIAL (FOLLOWING, CHEERS)
// ============================================================
export async function sendFollowRequest(fromId: string, toId: string, fromName: string) {
  await setDoc(doc(db, 'follow_requests', `${fromId}_${toId}`), { fromId, toId, fromName, status: 'pending', createdAt: Date.now() })
}

export async function getFollowRequests(userId: string) {
  const q2 = query(collection(db, 'follow_requests'), where('toId', '==', userId), where('status', '==', 'pending'))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function respondFollowRequest(docId: string, status: string) {
  await updateDoc(doc(db, 'follow_requests', docId), { status })
}

export async function getFollowing(userId: string) {
  const q2 = query(collection(db, 'follow_requests'), where('fromId', '==', userId), where('status', '==', 'accepted'))
  const snap = await getDocs(q2)
  return snap.docs.map(d => (d.data() as any).toId)
}

export async function sendCheer(fromId: string, fromName: string, toId: string, message: string) {
  await addDoc(collection(db, 'cheers'), { fromId, fromName, toId, message, timestamp: Date.now(), read: false })
}

export async function getCheers(userId: string) {
  const q2 = query(collection(db, 'cheers'), where('toId', '==', userId), where('read', '==', false), limit(20))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function markCheerRead(id: string) {
  await updateDoc(doc(db, 'cheers', id), { read: true })
}

// ============================================================
// MENTOR
// ============================================================
export async function sendMentorRequest(mentorId: string, mentorName: string, learnerId: string) {
  await setDoc(doc(db, 'mentor_requests', `${mentorId}_${learnerId}`), { mentorId, mentorName, learnerId, status: 'pending', createdAt: Date.now() })
}

export async function getMentorRequests(learnerId: string) {
  const q2 = query(collection(db, 'mentor_requests'), where('learnerId', '==', learnerId), where('status', '==', 'pending'))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function respondMentorRequest(docId: string, status: string) {
  await updateDoc(doc(db, 'mentor_requests', docId), { status })
}

export async function getMentees(mentorId: string) {
  const q2 = query(collection(db, 'mentor_requests'), where('mentorId', '==', mentorId), where('status', '==', 'accepted'))
  const snap = await getDocs(q2)
  return snap.docs.map(d => (d.data() as any).learnerId)
}

// ============================================================
// GROUPS
// ============================================================
export async function createGroup(group: any) {
  await setDoc(doc(db, 'groups', group.id), group)
}

export async function getGroup(groupId: string) {
  const snap = await getDoc(doc(db, 'groups', groupId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getAllGroups() {
  const snap = await getDocs(collection(db, 'groups'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateGroup(groupId: string, data: any) {
  await setDoc(doc(db, 'groups', groupId), data, { merge: true })
}

export async function getGroupByInviteCode(code: string) {
  const snap = await getDocs(collection(db, 'groups'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .find((g: any) => g.inviteCode === code.toUpperCase()) || null
}

export async function joinGroupByInviteCode(code: string, userId: string, userName: string) {
  const group: any = await getGroupByInviteCode(code)
  if (!group) throw new Error('Invalid invite code')
  const members = group.members || []
  if (members.some((m: any) => m.userId === userId)) throw new Error('Already a member of this group')
  members.push({ userId, name: userName, roles: ['learner'], joinedAt: Date.now() })
  await updateDoc(doc(db, 'groups', group.id), { members })
  return group
}

export async function getGroupsForUser(userId: string) {
  const snap = await getDocs(collection(db, 'groups'))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((g: any) => (g.members || []).some((m: any) => m.userId === userId))
}

export async function addGroupMember(groupId: string, member: any) {
  const group: any = await getGroup(groupId)
  if (!group) return
  const members = group.members || []
  const idx = members.findIndex((m: any) => m.userId === member.userId)
  if (idx >= 0) members[idx] = { ...members[idx], ...member }
  else members.push(member)
  await updateDoc(doc(db, 'groups', groupId), { members })
}

export async function removeGroupMember(groupId: string, userId: string) {
  const group: any = await getGroup(groupId)
  if (!group) return
  await updateDoc(doc(db, 'groups', groupId), { members: (group.members || []).filter((m: any) => m.userId !== userId) })
}

export async function updateGroupMemberRoles(groupId: string, userId: string, roles: string[]) {
  const group: any = await getGroup(groupId)
  if (!group) return
  const members = (group.members || []).map((m: any) => m.userId === userId ? { ...m, roles } : m)
  await updateDoc(doc(db, 'groups', groupId), { members })
}

export async function getGroupJoinRequests(groupId: string) {
  const q2 = query(collection(db, 'group_requests'), where('groupId', '==', groupId), where('status', '==', 'pending'))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function requestJoinGroup(groupId: string, userId: string, userName: string, roles: string[]) {
  await setDoc(doc(db, 'group_requests', `${userId}_${groupId}`), {
    groupId, userId, userName, requestedRoles: roles, status: 'pending', createdAt: Date.now()
  })
}

export async function respondGroupRequest(docId: string, status: string) {
  await updateDoc(doc(db, 'group_requests', docId), { status })
}

// ============================================================
// AI CONFIG
// ============================================================
export async function saveAiConfig(userId: string, config: any) {
  await setDoc(doc(db, 'ai_config', userId), { ...config, updatedAt: Date.now() })
}

export async function getAiConfig(userId: string) {
  const snap = await getDoc(doc(db, 'ai_config', userId))
  return snap.exists() ? snap.data() : null
}

export async function deleteAiConfig(userId: string) {
  await deleteDoc(doc(db, 'ai_config', userId))
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================
export async function getAnnouncements(userId: string) {
  const q2 = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10))
  const snap = await getDocs(q2)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((a: any) => !(a.read || []).includes(userId))
}

export async function markAnnouncementRead(announcementId: string, userId: string) {
  const snap = await getDoc(doc(db, 'announcements', announcementId))
  if (snap.exists()) {
    const data = snap.data()
    const readList = data.read || []
    if (!readList.includes(userId)) {
      await updateDoc(doc(db, 'announcements', announcementId), { read: [...readList, userId] })
    }
  }
}

export async function createAnnouncement(packageId: string, packageName: string) {
  await addDoc(collection(db, 'announcements'), {
    type: 'new_course', packageId, packageName,
    message: `New course published: ${packageName}`,
    createdAt: Date.now(), read: []
  })
}

// ============================================================
// SPACED REPETITION
// ============================================================
export async function saveFactConfidence(userId: string, packageId: string, factId: string, confidence: number) {
  const interval = confidence >= 0.8 ? 7 : confidence >= 0.5 ? 3 : 1
  await setDoc(doc(db, 'spaced_rep', `${userId}_${factId}`), {
    userId, packageId, factId, confidence,
    lastReviewed: Date.now(),
    nextReview: Date.now() + interval * 86400000,
  }, { merge: true })
}

export async function getSpacedRepData(userId: string, packageId?: string) {
  let q2
  if (packageId) {
    q2 = query(collection(db, 'spaced_rep'), where('userId', '==', userId), where('packageId', '==', packageId))
  } else {
    q2 = query(collection(db, 'spaced_rep'), where('userId', '==', userId))
  }
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ============================================================
// CROSS-PUBLISH
// ============================================================
export async function crossPublishCourse(packageId: string, targetGroupId: string, mode: 'link' | 'copy') {
  await setDoc(doc(db, 'cross_publish', `${packageId}_${targetGroupId}`), {
    packageId, targetGroupId, mode, createdAt: Date.now()
  })
}

// ============================================================
// DELETE ALL USER DATA (Right to be forgotten)
// ============================================================
export async function deleteAllUserData(userId: string) {
  // Delete direct docs
  const directDocs = ['users', 'gamification', 'ai_config']
  for (const col of directDocs) {
    try { await deleteDoc(doc(db, col, userId)) } catch {}
  }
  // Delete queried docs
  const queriedCols = ['test_results', 'learner_progress', 'spaced_rep']
  for (const col of queriedCols) {
    try {
      const q2 = query(collection(db, col), where('userId', '==', userId))
      const snap = await getDocs(q2)
      for (const d of snap.docs) await deleteDoc(d.ref)
    } catch {}
  }
}

// ============================================================
// SPOTIFY LISTENING STATUS
// ============================================================
export async function updateListeningStatus(userId: string, track: { name: string; artist: string; uri: string } | null) {
  await setDoc(doc(db, 'listening_status', userId), {
    track, updatedAt: Date.now(), active: !!track,
  }, { merge: true })
}

export async function getListeningStatus(userId: string) {
  const snap = await getDoc(doc(db, 'listening_status', userId))
  if (!snap.exists()) return null
  const data = snap.data()
  // Only show if updated in last 5 minutes
  if (data.active && data.updatedAt > Date.now() - 5 * 60 * 1000) return data.track
  return null
}

// ============================================================
// MUSIC SHARING
// ============================================================
export async function shareMusic(fromUserId: string, fromName: string, toUserId: string, track: { name: string; artist: string; uri: string }) {
  await addDoc(collection(db, 'music_shares'), {
    fromUserId, fromName, toUserId, track, createdAt: Date.now(), read: false,
  })
}

export async function getMusicShares(userId: string) {
  const q2 = query(collection(db, 'music_shares'), where('toUserId', '==', userId), orderBy('createdAt', 'desc'), limit(20))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ============================================================
// CONTENT REPORTS / FLAGS
// ============================================================
export async function reportContent(report: {
  reporterId: string; reporterName: string;
  contentType: 'cheer' | 'feedback' | 'course' | 'message';
  contentId?: string; contentText: string;
  targetUserId: string; reason: string;
}) {
  await addDoc(collection(db, 'content_reports'), {
    ...report, status: 'pending', createdAt: Date.now(),
  })
  // Increment user's flag count
  const userRef = doc(db, 'users', report.targetUserId)
  await updateDoc(userRef, { flagCount: increment(1) })
}

export async function getContentReports(status?: string) {
  const q2 = status
    ? query(collection(db, 'content_reports'), where('status', '==', status), orderBy('createdAt', 'desc'))
    : query(collection(db, 'content_reports'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q2)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function resolveReport(reportId: string, resolution: 'dismissed' | 'actioned', note?: string) {
  await updateDoc(doc(db, 'content_reports', reportId), {
    status: resolution, resolvedAt: Date.now(), adminNote: note || '',
  })
}

// ============================================================
// AUTO-SUSPENSION
// ============================================================
export async function checkAndSuspendUser(userId: string): Promise<boolean> {
  const userSnap = await getDoc(doc(db, 'users', userId))
  if (!userSnap.exists()) return false
  const data = userSnap.data()
  const flagCount = data.flagCount || 0
  if (flagCount >= 3 && data.status !== 'suspended') {
    await updateDoc(doc(db, 'users', userId), { status: 'suspended', suspendedAt: Date.now() })
    return true
  }
  return false
}

// ============================================================
// PRIVACY SETTINGS
// ============================================================
export async function updatePrivacySettings(userId: string, settings: {
  showInSearch?: boolean; showProgress?: boolean; showOnLeaderboard?: boolean;
}) {
  await setDoc(doc(db, 'users', userId), { privacySettings: settings }, { merge: true })
}

export async function getPrivacySettings(userId: string) {
  const snap = await getDoc(doc(db, 'users', userId))
  const data = snap.exists() ? snap.data() : {}
  return data.privacySettings || { showInSearch: true, showProgress: true, showOnLeaderboard: true }
}

// ============================================================
// FEATURE GATING (FREE TIER)
// ============================================================
export async function getUserUsageToday(userId: string): Promise<{ testsToday: number; coursesCreated: number }> {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const q2 = query(collection(db, 'test_results'), where('userId', '==', userId), where('timestamp', '>=', todayStart.getTime()))
  const snap = await getDocs(q2)
  // Count courses created by user
  const pkgSnap = await getDocs(query(collection(db, 'packages'), where('authorId', '==', userId)))
  return { testsToday: snap.size, coursesCreated: pkgSnap.size }
}

// ============================================================
// VIDEO UPLOADS
// ============================================================
export async function addVideoToPackage(packageId: string, video: { name: string; url: string; storagePath: string }) {
  const pkgRef = doc(db, 'packages', packageId)
  const snap = await getDoc(pkgRef)
  if (!snap.exists()) return
  const data = snap.data()
  const videos = data.videos || []
  videos.push({ ...video, addedAt: Date.now() })
  await updateDoc(pkgRef, { videos })
}

// ============================================================
// LINKED COURSE PROPAGATION
// ============================================================
export async function propagateLinkedCourseUpdates(sourcePackageId: string) {
  const q2 = query(collection(db, 'cross_publish'), where('packageId', '==', sourcePackageId), where('mode', '==', 'link'))
  const snap = await getDocs(q2)
  if (snap.empty) return []
  const sourcePkg = await getDoc(doc(db, 'packages', sourcePackageId))
  if (!sourcePkg.exists()) return []
  const sourceData = sourcePkg.data()
  const updated: string[] = []
  for (const cpDoc of snap.docs) {
    const cp = cpDoc.data()
    // Update linked copies in target groups with source facts/categories
    const targetQ = query(
      collection(db, 'packages'),
      where('linkedSourceId', '==', sourcePackageId),
      where('groupId', '==', cp.targetGroupId)
    )
    const targets = await getDocs(targetQ)
    for (const t of targets.docs) {
      await updateDoc(t.ref, {
        facts: sourceData.facts,
        categories: sourceData.categories,
        content: sourceData.content,
        linkedUpdatedAt: Date.now(),
      })
      updated.push(t.id)
    }
  }
  return updated
}
