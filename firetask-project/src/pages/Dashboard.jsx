import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthProvider"
import { addDoc, collection, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./Dashboard.css"
import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [projectList, setProjectList] = useState([]);
  const [message, setMessage] = useState("");
  const projectDoc = collection(db, "Projects");
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if(!projectName.trim()){
      setMessage("Project name is required.");
      return;
    }

    try {
      await addDoc(projectDoc, {
        name: projectName,
        description: "",
        deadline: null,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        members: [user.uid]
      });
      setProjectName("");
    } catch (err) {
      setMessage(err.message);
      console.error(err.message);
    }
  }

  useEffect(() => {
    const q = query(projectDoc, where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const projectArray = [];
      snapshot.forEach((doc) => {
        projectArray.push({
          id: doc.id,
          ...doc.data(),
        })
      })
      setProjectList(projectArray);
    })
    return () => unsub(); // unmount
  }, [user.uid]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user.email}</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          type="text"
          placeholder="Project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)} 
        />
      <button type="submit">Create Project</button>
      </form>
      <p>{message}</p>

      <h3>Your Projects:</h3>
      {projectList.length === 0 ? <p>No projects.</p> : (
        <ul>
          {projectList.map((project) => (
            <li key={project.id}>
              <Link to={`/project/${project.id}`}>
              {project.name} - {project.description} - {project.deadline ? project.deadline.toDate().toLocaleDateString() : "No deadline"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dashboard

