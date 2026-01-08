import { db, auth } from '../../firebaseConfig'; 
import { 
  collection, addDoc, doc, setDoc, updateDoc, getDoc, getDocs,
  serverTimestamp, query, where, orderBy, onSnapshot, increment 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  signOut 
} from "firebase/auth";
import * as Notifications from 'expo-notifications';

/**
 * ==========================================
 * 1. AUTHENTICATION & REGISTRATION
 * ==========================================
 */

/**
 * Registers a new volunteer and initializes their profile in Firestore.
 * Portfolio Note: Merges Auth creation with a custom user document for role-based access.
 */
export const registerVolunteer = async (email, password, fullName, photo, extraData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userData = {
      uid: user.uid,
      name: fullName,
      email: email,
      role: 'volunteer',
      tierId: extraData.tierId || 'student', 
      university: extraData.university || null,
      studentId: extraData.studentId || null,
      certificateNo: extraData.certificateNo || null,
      licenseNo: extraData.licenseNo || null,
      points: 0,
      resolvedCount: 0, 
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), userData);
    
    return { success: true, uid: user.uid, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Registers a pet owner and saves contact details to Firestore.
 */
export const registerOwner = async (email, password, fullName, phone) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { 
      displayName: fullName 
    });

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: fullName,
      email: email,
      phone: phone,
      role: 'owner',
      createdAt: serverTimestamp(),
    });

    return { success: true, uid: user.uid };
  } catch (error) {
    console.error("Owner Register Error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Signs out the current user.
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout Error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ==========================================
 * 2. EMERGENCY SOS ACTIONS
 * ==========================================
 */

/**
 * Creates an emergency alert and broadcasts it to all volunteers.
 * Portfolio Note: Implements a "Sanitization" layer for location data to prevent Map crashes.
 */
export const triggerSOS = async (userId, userName, petSymptoms, location, severity, photoURL = null) => {
  try {
    const alertsRef = collection(db, 'alerts');
    
    const sanitizedLocation = location ? {
      lat: location.lat || 0,
      lng: location.lng || 0
    } : null;

    // Fetch owner phone for immediate volunteer contact
    const ownerDoc = await getDoc(doc(db, 'users', userId));
    const ownerPhone = ownerDoc.exists() ? ownerDoc.data().phone : "";

    const newDoc = await addDoc(alertsRef, {
      ownerId: userId,
      ownerName: userName,
      ownerPhone: ownerPhone,
      symptoms: petSymptoms,
      location: sanitizedLocation, 
      severity: severity, 
      imageUrl: photoURL, 
      status: 'pending',
      assignedVetId: null,
      advice: "",
      createdAt: serverTimestamp(),
    });

    // Broadcast to the volunteer network
    await sendPushNotification(
      "🚨 NEW EMERGENCY",
      `${userName || 'An owner'} needs help with: ${(petSymptoms || '').substring(0, 30)}...`
    );

    return { success: true, alertId: newDoc.id };
  } catch (error) {
    console.error("Trigger SOS Error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Assigns a specific volunteer to an active SOS alert.
 */
export const acceptSOS = async (alertId, volunteerId, volunteerName, volunteerTier) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, {
      status: 'accepted',
      assignedVetId: volunteerId,
      assignedVetName: volunteerName,
      assignedVetTier: volunteerTier,
      advice: "A responder is reviewing your case...",
      helpType: volunteerTier === 'student' ? 'Remote Advice' : 'In-Person Assistance'
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * ==========================================
 * 3. TRIAGE & HANDOFF LOGIC (The "Core" of PawSOS)
 * ==========================================
 */

/**
 * Moves a case from a student to senior pool and rewards the student for triage.
 * Demonstrates: Gamification logic (points) and automated workflow escalation.
 */
export const escalateAndHandOff = async (alertId, studentId, symptoms, severity) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    
    // Reward points for successful triage before escalation
    let triagePoints = 15; 
    if (severity === 'mid') triagePoints = 25;

    await updateDoc(alertRef, {
      status: 'escalated',
      isEscalated: true,
      prevAssignedId: studentId, 
      assignedVetId: null, 
      assignedVetName: null,
      lastUpdated: serverTimestamp()
    });

    const userRef = doc(db, 'users', studentId);
    await updateDoc(userRef, {
      points: increment(triagePoints),
      resolvedCount: increment(1) 
    });

    // Narrow broadcast to Seniors only
    await notifySeniorVolunteers(alertId, symptoms);

    return { success: true };
  } catch (error) {
    console.error("Handoff Error:", error.message);
    return { success: false, error: error.message };
  }
};

export const takeOverCase = async (alertId, seniorId, seniorName, seniorTier) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, {
      assignedVetId: seniorId,
      assignedVetName: seniorName,
      assignedVetTier: seniorTier,
      status: 'accepted',
      isEscalated: false, 
      helpType: 'In-Person Assistance',
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * ==========================================
 * 4. CASE MANAGEMENT & LOCATION MATHEMATICS
 * ==========================================
 */

export const updateClipboard = async (alertId, status, advice) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, {
      status: status,
      advice: advice,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Calculates distance between volunteer and owner using the Haversine Formula.
 * Portfolio Note: Shows math implementation within a real-time system.
 */
export const updateLiveLocation = async (alertId, volunteerLat, volunteerLng, ownerLat, ownerLng) => {
  try {
    if (!ownerLat || !ownerLng) return { success: false, error: "Owner location missing" };

    const R = 6371; // Earth's radius in km
    const dLat = (ownerLat - volunteerLat) * Math.PI / 180;
    const dLon = (ownerLng - volunteerLng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(volunteerLat * Math.PI / 180) * Math.cos(ownerLat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; 

    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, {
      currentDistance: distance.toFixed(2),
      lastLocationUpdate: serverTimestamp()
    });
    
    return { success: true, distance: distance.toFixed(2) };
  } catch (error) {
    console.error("Location Update Error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Closes a case and awards points based on emergency severity.
 */
export const resolveCase = async (alertId, volunteerId) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    const alertSnap = await getDoc(alertRef);
    
    if (!alertSnap.exists()) throw new Error("Alert not found");
    const alertData = alertSnap.data();

    if (alertData.status === 'resolved') return { success: true };

    // Gamification Logic: Harder cases = Higher rewards
    let pointsToAward = 10; 
    if (alertData.severity === 'mid') pointsToAward = 25;
    if (alertData.severity === 'high') pointsToAward = 50;

    await updateDoc(alertRef, { 
      status: 'resolved',
      resolvedAt: serverTimestamp(),
      currentDistance: null 
    });

    const userRef = doc(db, 'users', volunteerId);
    await updateDoc(userRef, {
      points: increment(pointsToAward),
      resolvedCount: increment(1) 
    });

    return { success: true, pointsEarned: pointsToAward };
  } catch (error) {
    console.error("Critical Resolve Case Error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ==========================================
 * 5. PUSH NOTIFICATIONS (Broadcasting)
 * ==========================================
 */

export const registerForPushNotifications = async (uid) => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync({
        // Replace with your real Project ID from Expo dashboard
        projectId: 'c3f1cf65-3ce1-4606-955d-4595bc2dd8a3'
    });
    const token = tokenData.data;
    
    await updateDoc(doc(db, "users", uid), { pushToken: token });
  } catch (error) {
    console.error("Push Token Error:", error);
  }
};

/**
 * Sends a notification via Expo Push API to all volunteers.
 */
export const sendPushNotification = async (title, body) => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "volunteer"));
    const snapshot = await getDocs(q);
    const tokens = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.pushToken) tokens.push(data.pushToken);
    });

    if (tokens.length === 0) return;

    const message = {
      to: tokens,
      sound: 'default',
      title: title || "Emergency Alert", 
      body: body || "A pet owner needs assistance.",
      data: { type: 'SOS_ALERT' },
      android: {
        channelId: 'emergency',
        priority: 'high',
      },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const notifySeniorVolunteers = async (caseId, symptoms) => {
  try {
    const q = query(
      collection(db, "users"), 
      where("role", "==", "volunteer"),
      where("tierId", "in", ["graduate", "qualified"])
    );
    
    const snapshot = await getDocs(q);
    const tokens = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.pushToken) tokens.push(data.pushToken);
    });

    if (tokens.length === 0) return { success: true };

    const message = {
      to: tokens,
      sound: 'default',
      title: '⚠️ URGENT: Case Escalation',
      body: `A Student responder requires assistance. Case: ${(symptoms || '').substring(0, 40)}...`,
      data: { type: 'ESCALATION_ALERT', caseId: caseId },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};