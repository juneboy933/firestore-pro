import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthProvider";
import { useNavigate, useParams } from "react-router-dom";
import { deleteDoc, doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import "./ProjectSettings.css";

const ProjectSettings = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchProject = async() => {
            try {
                const ref = doc(db, "Projects", id);
                const snap = await getDoc(ref);
                if(snap.exists()){
                    const data = snap.data();
                    setProject({id: snap.id, ...data });
                    setName(data.name || "(");
                    setDescription(data.description || "");
                    setDeadline(data.deadline? data.deadline.toDate().toISOString().split("T")[0] : "");
                } else {
                    setMessage("Project not found.");
                }
            } catch (err) {
                console.error("Error loading project:", err);
            }
        };
        fetchProject();
    }, [id]);

    const handlesave = async(e) => {
        e.preventDefault();
        try {
            const ref = doc(db, "Projects", id);
            await updateDoc(ref, {
                name,
                description,
                deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
            });
            setMessage("Project updated.");
        } catch (err) {
            console.error("error updating project:", err);
            setMessage("Failed to update project.");
        }
    };

    const handleDelete = async () => {
        const confirm = window.confirm("Are you sue you want to delete this project?");
        if(!confirm) return;

        try {
            await deleteDoc(doc(db, "Projects", id));
            navigate("/dashboard");
        } catch (err) {
            console.error("Error deleting project:", err);
        }
    }
    
    if(!project) return <p>Loading project....</p>;
    if(project.createdBy !== user.uid) return <p>Unauthorized access.</p>

  return (
    <div className="project-settings">
      <h2>Edit Project Settings</h2>
      <form onSubmit={handlesave}>
        <label>Project Name:</label>
        <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
        />

        <label>Description:</label>
        <textarea
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        />
        
        <label>Deadline:</label>
        <input 
            type="date" 
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
        />
        <button type="submit">Save Changes</button>
      </form>
      <p>{message}</p>

      <button onClick={handleDelete}>Delete Project</button>
      <br />
      <button onClick={() => navigate("/dashboard")}>Back to dashboard</button>
    </div>
  )
}

export default ProjectSettings
