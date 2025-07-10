import { useAuth } from "../context/AuthProvider"
import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"

const Profile = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setRole(data.role || "");
      }
    };
    fetchUser();
  }, [user.uid]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { name, role });
    setMessage("Profile updated.");
  }

  return (
    <div>
      <h2>Your Profile</h2>
      <form onSubmit={handleUpdate}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        <button type="submit">Save</button>
      </form>
      <p>{message}</p>
    </div>
  )
}

export default Profile
