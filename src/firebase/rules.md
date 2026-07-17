// Firebase Realtime Database Rules
// Deploy with: firebase deploy --only database

{
  "rules": {
    ".read": false,
    ".write": false,

    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('admins').child(auth.uid).exists())",
        ".write": "auth != null && (auth.uid == $uid || root.child('admins').child(auth.uid).exists())"
      }
    },

    "employees": {
      ".read": "auth != null",
      ".write": "root.child('admins').child(auth.uid).exists()"
    },

    "leaves": {
      ".read": "auth != null",
      "$leaveId": {
        ".write": "auth != null && (
          root.child('users').child(auth.uid).exists() ||
          root.child('admins').child(auth.uid).exists()
        )"
      }
    },

    "attendance": {
      ".read": "auth != null",
      ".write": "root.child('admins').child(auth.uid).exists() || auth.uid != null"
    },

    "documents": {
      ".read": "auth != null",
      ".write": "root.child('admins').child(auth.uid).exists() || auth.uid != null"
    },

    "holidays": {
      ".read": "auth != null",
      ".write": "root.child('admins').child(auth.uid).exists()"
    },

    "tickets": {
      ".read": "auth != null",
      ".write": "auth.uid != null"
    },

    "audit": {
      ".read": "root.child('admins').child(auth.uid).exists()",
      ".write": "root.child('admins').child(auth.uid).exists()"
    }
  }
}