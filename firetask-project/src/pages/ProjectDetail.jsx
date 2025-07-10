import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { useEffect, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import "./ProjectDetail.css";
import { db } from "../firebase";
import { logActivity } from "../utils/logActivity";

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [taskName, setTaskName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [collabEmail, setCollabEmail] = useState("");
  const [collabMessage, setCollabMessage] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [filter, setFilter] = useState("all");
  const [activityLog, setActivityLog] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const logsRef = collection(db, "activity_logs");
    const q = query(logsRef, where("projectId", "==", id));
    const unsub = onSnapshot(q, async (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      const enrichedLogs = logs.map((log) => ({
        ...log,
        userEmail: log.userEmail || "Unknown user",
      }));
      
  
      setActivityLog(
        enrichedLogs.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        )
      );
    });
  
    return () => unsub();
  }, [id]);
  

  useEffect(() => {
    const getProject = async () => {
      const docRef = doc(db, "Projects", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProject({
          id: docSnap.id,
          ...docSnap.data(),
        });
        getCollaborators(docSnap.data().members);
      } else {
        setMessage("Project not found.");
      }
    };
    getProject();
  }, [id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const taskDoc = collection(db, "tasks");
      await addDoc(taskDoc, {
        name: taskName,
        createdAt: Timestamp.now(),
        status: "Not complete",
        projectId: id,
        createdBy: user.uid,
      });
      await logActivity({
        projectId: id,
        message: `Added task "${taskName}"`,
        performedBy: user.uid,
        userEmail: user.email,
      });
      setTaskName("");
    } catch (err) {
      setMessage("Failed to add task.");
      console.error(err);
    }
  };

  const toggleTaskStatus = async (task) => {
    const taskRef = doc(db, "tasks", task.id);
    try {
      await updateDoc(taskRef, {
        status: task.status === "complete" ? "Not complete" : "complete",
      });
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDelete = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    try {
      await deleteDoc(taskRef);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleUpdateTask = async (taskId) => {
    if (!newTaskName.trim()) return;
    const taskRef = doc(db, "tasks", taskId);
    try {
      await updateDoc(taskRef, {
        name: newTaskName,
      });
      await logActivity({
        projectId: id,
        message: `Renamed task to "${newTaskName}"`,
        performedBy: user.uid,
        userEmail: user.email,
      });
      setEditingTaskId(null);
      setNewTaskName("");
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const getCollaborators = async (membersId) => {
    if (!membersId || membersId.length === 0) return;

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("__name__", "in", membersId));
      const snapshot = await getDocs(q);

      const result = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCollaborators(result);
    } catch (err) {
      console.error("Error fetching collaborators:", err);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      const projectRef = doc(db, "Projects", project.id);
      await updateDoc(projectRef, {
        members: arrayRemove(collaboratorId),
      });
  
      // get collaborator email before logging
      const userRef = doc(db, "users", collaboratorId);
      const userSnap = await getDoc(userRef);
      const removedEmail = userSnap.exists() ? userSnap.data().email : "unknown";
  
      await logActivity({
        projectId: id,
        message: `Removed collaborator ${removedEmail}`,
        performedBy: user.uid,
        userEmail: user.email,
      });
  
      setCollaborators((prev) =>
        prev.filter((u) => u.id !== collaboratorId)
      );
    } catch (err) {
      console.error("Error removing collaborator:", err);
    }
  };


  useEffect(() => {
    const taskDoc = collection(db, "tasks");
    const q = query(taskDoc, where("projectId", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(data);
    });
    return () => unsub();
  }, [id]);

  if (!project) return <p>Loading project...</p>;

  return (
    <div className="project-detail">
      <h2>{project.name}</h2>
      <button className="back-btn" onClick={() => window.history.back()}>
        ← Back to Dashboard
      </button>
      <button onClick={() => navigate(`/project/${project.id}/settings`)}>
        ⚙ Project Settings
      </button>

      <form onSubmit={handleAddTask}>
        <input
          type="text"
          placeholder="New Task"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <button type="submit">Add Task</button>
      </form>

      <h3>Add Collaboration</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setCollabMessage("");

          try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", collabEmail));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
              setCollabMessage("User not found.");
              return;
            }

            const userDoc = snapshot.docs[0];
            const collaboratorId = userDoc.id;

            const projectRef = doc(db, "Projects", project.id);
            await updateDoc(projectRef, {
              members: arrayUnion(collaboratorId),
            });

            await logActivity({
              projectId: id,
              message: `Added ${collabEmail} as collaborator`,
              performedBy: user.uid,
              userEmail: user.email,
            });

            setCollabMessage("Collaborator added.");
            setCollabEmail("");
          } catch (err) {
            setCollabMessage("Error adding collaborator.");
            console.error(err);
          }
        }}
      >
        <input
          type="email"
          placeholder="Collaborator Email"
          value={collabEmail}
          onChange={(e) => setCollabEmail(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <p>{collabMessage}</p>
      <p>{message}</p>

      <h3>Tasks</h3>
      <ul>
        {tasks.length === 0 && <p>No tasks yet.</p>}
        {tasks
          .filter((task) => {
            if (filter === "all") return true;
            if (filter === "complete") return task.status === "complete";
            if (filter === "incomplete") return task.status !== "complete";
            return true;
          })
          .map((task) => (
            <li
              key={task.id}
              className={`task-item ${
                task.status === "Complete" ? "done" : ""
              }`}
              onClick={() => toggleTaskStatus(task)}
            >
              {editingTaskId === task.id ? (
                <>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Update task name"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateTask(task.id);
                    }}
                    className="save-btn"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTaskId(null);
                      setNewTaskName("");
                    }}
                    className="cancel-btn"
                  >
                    ❌ Cancel
                  </button>
                </>
              ) : (
                <>
                  <span>
                    {task.name} - <strong>{task.status}</strong>
                  </span>
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTaskId(task.id);
                        setNewTaskName(task.name);
                      }}
                      className="edit-btn"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(task.id);
                      }}
                      className="delete-btn"
                    >
                      ❌
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
      </ul>

      <div className="task-filter">
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("complete")}>Complete</button>
        <button onClick={() => setFilter("incomplete")}>Incomplete</button>
      </div>

      <h4>Collaborators:</h4>
      <ul className="collab-list">
        {collaborators.map((collab) => (
          <li key={collab.id} className="collab-item">
            <div className="avatar">{collab.email[0].toUpperCase()}</div>
            <div className="collab-info">
              <strong>{collab.name || collab.email}</strong>
              <small>{collab.role}</small>
            </div>

            {collab.id === project.createdBy && (
              <span className="badge">Owner</span>
            )}

            {user.uid === project.createdBy &&
              collab.id !== project.createdBy && (
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveCollaborator(collab.id)}
                >
                  Remove
                </button>
              )}
          </li>
        ))}
      </ul>

      <h4>Project Activity Log:</h4>
      <ul>
        {activityLog.map((log) => (
          <li key={log.id}>
            <strong>{log.userEmail}</strong>: {log.message} <br />
            <small>
              {new Date(
                log.createdAt?.seconds * 1000
              ).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectDetail;
