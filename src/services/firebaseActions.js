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

// 1. REGISTER VOLUNTEER - ADDED resolvedCount
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

// REGISTER OWNER
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

// 2. TRIGGER SOS WITH SEVERITY
export const triggerSOS = async (userId, userName, petSymptoms, location, severity, photoURL = null) => {
  try {
    const alertsRef = collection(db, 'alerts');
    
    const sanitizedLocation = location ? {
      lat: location.lat || 0,
      lng: location.lng || 0
    } : null;

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

    await sendPushNotification(
      "🚨 NEW EMERGENCY",
      `${userName || 'An owner'} needs help with: ${(petSymptoms || '').substring(0, 30)}...`
    );

    return { success: true };
  } catch (error) {
    console.error("Trigger SOS Error:", error.message);
    return { success: false, error: error.message };
  }
};

// 3. ACCEPT SOS
export const acceptSOS = async (alertId, volunteerId, volunteerName, volunteerTier) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, {
      status: 'accepted',
      assignedVetId: volunteerId,
      assignedVetName: volunteerName,
      assignedVetTier: volunteerTier,
      advice: "Expert is reviewing your case...",
      helpType: volunteerTier === 'student' ? 'Remote Advice' : 'In-Person Assistance'
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// UPDATED: ESCALATE AND HAND OFF (Student rewards and exits)
export const escalateAndHandOff = async (alertId, studentId, symptoms, severity) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    
    // Triage points for student
    let triagePoints = 15; 
    if (severity === 'mid') triagePoints = 25;

    // Update Alert: Clear assignedVetId so it appears in Senior "Escalated" Tab
    await updateDoc(alertRef, {
      status: 'escalated',
      isEscalated: true,
      prevAssignedId: studentId, 
      assignedVetId: null, 
      lastUpdated: serverTimestamp()
    });

    // Reward the student
    const userRef = doc(db, 'users', studentId);
    await updateDoc(userRef, {
      points: increment(triagePoints),
      resolvedCount: increment(1) 
    });

    // Notify Seniors
    await notifySeniorVolunteers(alertId, symptoms);

    return { success: true };
  } catch (error) {
    console.error("Handoff Error:", error.message);
    return { success: false, error: error.message };
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

    if (tokens.length === 0) return { success: true, info: "No senior volunteers to notify" };

    const message = {
      to: tokens,
      sound: 'default',
      title: '⚠️ URGENT: Case Escalation',
      body: `A Student requires assistance. Symptoms: ${(symptoms || '').substring(0, 40)}...`,
      data: { type: 'ESCALATION_ALERT', caseId: caseId },
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

    return { success: true };
  } catch (error) {
    console.error("Escalation Notification Error:", error);
    return { success: false, error: error.message };
  }
};

// UPDATED: TAKE OVER (Seniors claim the escalated case)
export const takeOverCase = async (alertId, seniorId, seniorName, seniorTier) => {
  try {
    const alertRef = doc(db, 'alerts', alertId);
    
    await updateDoc(alertRef, {
      assignedVetId: seniorId,
      assignedVetName: seniorName,
      assignedVetTier: seniorTier,
      status: 'accepted', // Moves it back to 'accepted' so it disappears from 'escalated' list
      isEscalated: false, 
      helpType: 'In-Person Assistance',
      lastUpdated: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error("Takeover Error:", error.message);
    return { success: false, error: error.message };
  }
};

// 4. UPDATE CLIPBOARD
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

// 5. UPDATE LIVE LOCATION
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
    
    return { success: true, distance };
  } catch (error) {
    console.error("Location Update Error:", error.message);
    return { success: false, error: error.message };
  }
};

// 6. RESOLVE CASE - ADDED resolvedCount INCREMENT
export const resolveCase = async (alertId, volunteerId) => {
  try {
    if (!alertId || !volunteerId) {
        throw new Error("Missing Case ID or Volunteer ID");
    }

    const alertRef = doc(db, 'alerts', alertId);
    const alertSnap = await getDoc(alertRef);
    
    if (!alertSnap.exists()) throw new Error("Alert not found");
    const alertData = alertSnap.data();

    if (alertData.status === 'resolved') return { success: true };

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

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout Error:", error.message);
    return { success: false, error: error.message };
  }
};

// PUSH NOTIFICATIONS LOGIC
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
        projectId: 'c3f1cf65-3ce1-4606-955d-4595bc2dd8a3'
    });
    const token = tokenData.data;
    
    await updateDoc(doc(db, "users", uid), { pushToken: token });
  } catch (error) {
    console.error("Push Token Error:", error);
  }
};

// BROADCAST TO ALL VOLUNTEERS
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